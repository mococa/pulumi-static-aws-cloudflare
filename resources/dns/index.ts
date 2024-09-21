/* ---------- External ---------- */
import { ComponentResource, ComponentResourceOptions, Config, Output } from "@pulumi/pulumi";
import { Record, RecordArgs } from "@pulumi/cloudflare";

/* ---------- Types ---------- */
interface Props {
    cname?: Output<string>
    subdomain: string
    comment?: RecordArgs['comment']
}

/* ---------- Constants ---------- */
const config = new Config();

export class DNSResource extends ComponentResource {
    record: Record;

    public constructor(
        name: string,
        props: Props,
        opts?: ComponentResourceOptions
    ) {
        super(`${name}:index`, name, {}, opts);

        const { cname, subdomain, comment } = props;

        if (!cname) throw new Error(`Missing CNAME.`);

        this.record = new Record('record', {
            name: subdomain,
            zoneId: config.require("cloudflare-zone-id"),
            type: "CNAME",
            content: cname,
            comment,
            ttl: 1,
            proxied: true,
        }, { parent: this });
    }
}