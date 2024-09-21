import { join } from 'path';

import { S3Resource } from './resources/s3';
import { DNSResource } from './resources/dns';
import { CertificateResource } from './resources/certificate';

import config from './config.json'

const certificate = new CertificateResource(`${config['project-name']}-cert`, {
    domain: config.domain,
    orgName: config['project-name']
})

const s3 = new S3Resource(`${config['project-name']}-s3`, {
    domain: config.domain,
    www: join(__dirname, 'www'),
})

const dns = new DNSResource(`${config['project-name']}-dns`, {
    subdomain: "@",
    cname: s3.website.websiteDomain,
    comment: `DNS for ${config['project-name']}`
}, { dependsOn: [certificate, s3.website] })
