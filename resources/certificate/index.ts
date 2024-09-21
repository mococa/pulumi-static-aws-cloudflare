/* ---------- External ---------- */
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { OriginCaCertificate } from "@pulumi/cloudflare";
import { PrivateKey, CertRequest } from "@pulumi/tls";
import { Certificate } from "@pulumi/aws/acm";

/* ---------- Types ---------- */
interface CertificateResourceProps {
    domain: string
    orgName: string
}

export class CertificateResource extends ComponentResource {
    certificate: OriginCaCertificate;
    key: PrivateKey;
    request: CertRequest;
    acm: Certificate;

    public constructor(
        name: string,
        props: CertificateResourceProps,
        opts?: ComponentResourceOptions
    ) {
        super(`${name}:index`, name, {}, opts);

        const { domain, orgName } = props;

        this.key = new PrivateKey(`private-key`, {
            algorithm: "RSA"
        }, { parent: this });

        this.request = new CertRequest(`cert-request`, {
            privateKeyPem: this.key.privateKeyPem,
            subject: {
                commonName: "",
                organization:  orgName,
            },
        }, { parent: this, dependsOn: this.key });

        this.certificate = new OriginCaCertificate(`cloudflare-certificate`, {
            csr: this.request.certRequestPem,
            hostnames: [`*.${domain}`, domain],
            requestType: "origin-rsa",
            requestedValidity: 5475, // Valid for 15 years
        }, { parent: this, dependsOn: this.request });

        this.acm = new Certificate(`acm-certificate`, {
            certificateBody: this.certificate.certificate,
            privateKey: this.key.privateKeyPem,
        }, { parent: this })
    }
}