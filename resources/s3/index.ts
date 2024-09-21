/* ---------- External ---------- */
import { ComponentResource, ComponentResourceOptions, interpolate } from "@pulumi/pulumi";
import { s3 } from "@pulumi/aws";
import { FileAsset } from "@pulumi/pulumi/asset";
import { createHash } from "crypto";
import { sync } from "glob";
import { resolve } from "path";
import * as mime from "mime";

/* ---------- Types ---------- */
interface S3ResourceProps {
  /**
   * Static files folder
   */
  www: string;

  /**
   * Domain for static build types (names bucket after this)
   */
  domain: string;
}

export class S3Resource extends ComponentResource {
  bucket: s3.BucketV2;
  access: s3.BucketPublicAccessBlock;
  policy: s3.BucketPolicy;
  website: s3.BucketWebsiteConfigurationV2;

  public constructor(
    name: string,
    props: S3ResourceProps,
    opts?: ComponentResourceOptions
  ) {
    super(`${name}:index`, name, {}, opts);

    const { www, domain } = props;

    this.bucket = new s3.BucketV2(
      `${name}-bucket`,
      {
        forceDestroy: true,
        bucket: domain,
      },
      { parent: this }
    );

    this.access = new s3.BucketPublicAccessBlock(
      `${name}-bucket-public-access`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      { parent: this, dependsOn: [this.bucket] }
    );

    this.policy = new s3.BucketPolicy(
      `${name}-bucket-policy`,
      {
        bucket: this.bucket.id,
        policy: {
          Version: "2012-10-17",
          Statement: [
            {
              Sid: `public-${name}`,
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:ListBucket", "s3:GetObject", "s3:PutObject"],
              Resource: [this.bucket.arn, interpolate`${this.bucket.arn}/*`],
            },
          ],
        },
      },
      {
        parent: this,
        dependsOn: [this.bucket, this.access],
      }
    );

    new s3.BucketCorsConfigurationV2(
      `${name}-bucket-cors`,
      {
        bucket: this.bucket.id,
        corsRules: [
          {
            allowedHeaders: ["*"],
            allowedMethods: ["GET"],
            allowedOrigins: ["*"],
            exposeHeaders: [],
          },
        ],
      },
      { parent: this, dependsOn: [this.bucket] }
    );

    const files = sync(`${www}/**`,
      {
        cwd: resolve(www),
        dot: true,
        nodir: true,
        follow: true,
      }
    );

    for (const file of files) {
      const hex = computeHexHash(file);

      // Add all files to the same level /
      const ssr_key = file.split(www)[1]

      let key = ssr_key;

      let removed_dot_html = false;

      // Removing .html from key if it should
      if (/^\w+.html$/.test(key)) {
        key = key.replace(".html", "");

        removed_dot_html = true;
      }

      new s3.BucketObject(
        `${name}-bucket-object-${hex}`,
        {
          bucket: this.bucket.id,
          key,
          source: new FileAsset(resolve(www, file)),
          contentType: removed_dot_html ? "text/html" : mime.getType(file) || undefined,
        },
        { parent: this, dependsOn: [this.policy, this.bucket] }
      );
    }

    this.website = new s3.BucketWebsiteConfigurationV2(
      `${name}-website`,
      {
        bucket: this.bucket.id,
        indexDocument: { suffix: "index.html" },
        errorDocument: { key: "404" },
      },
      { parent: this, dependsOn: [this.bucket, this.policy, this.access] }
    );

  }
}

function computeHexHash(s: string) {
  return createHash("sha256").update(s).digest("hex");
}
