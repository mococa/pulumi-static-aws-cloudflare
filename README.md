# Pulumi Static Cloudflare AWS

Small Pulumi App for deploying static websites (html, css, javascript, whatever) in an s3 bucket handling DNS with Cloudflare.

For cloudflare create a token with the following permissions:
- Config Rules:Edit
- DNS:Edit
- SSL and Certificates:Edit
- Cache Purge:Purge
- Zone Settings:Edit

Don't forget the zone id

Put it in the Pulumi.dev.yaml

*You can also use pulumi config --secret so you can git it*

## Requirements

- Pulumi CLI
- AWS CLI
- Node

## Getting Started

1. Install dependencies with npm/yarn

```bash
npm install
```

2. Get your cloudflare zone id to `Pulumi.dev.yaml`
3. Get your cloudflare api token to `Pulumi.dev.yaml`
4. You can set your default aws profile on `Pulumi.dev.yaml` (optional)
5. You can tweak the default aws region on `PUlumi.dev.yaml` (optional)
6. Deploy running `pulumi up --skip-preview`