<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rapidpages/vault/c458b4e2070fdf3e32c5796eaa9488f95f2ac40f/logo-long-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/rapidpages/vault/c458b4e2070fdf3e32c5796eaa9488f95f2ac40f/logo-long-light.png">
  <img alt="Rapidpages" src="https://raw.githubusercontent.com/rapidpages/vault/c458b4e2070fdf3e32c5796eaa9488f95f2ac40f/logo-long-dark.png">
</picture>
</p>

<p align="center">
  <a href="https://www.rapidpages.com?ref=github-readme" target="_blank">Website</a> • <a href="https://discord.gg/W6jYq46Frd" target="_blank">Discord</a>
</p>

# Rapidpages

Rapidpages is a prompt-first IDE for building great-looking pages. You simply describe the UI you desire and it will generate the code for that component using the technologies that are familiar to you (currently only React+Tailwind are supported).

https://github.com/rapidpages/rapidpages/assets/1308560/a7505448-bc0d-4035-9cff-39e8df5ecac9

## Get Started

[![Lint](https://github.com/rapidpages/rapidpages/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/rapidpages/rapidpages/actions/workflows/lint.yml)

### Run Rapidpages locally

```bash
git clone https://github.com/rapidpages/rapidpages.git && cd rapidpages
```

Edit the `.env.example` file to ensure the following values are set:

Login:

- `GITHUB_CLIENT_SECRET` & `GITHUB_CLIENT_ID`: you need to [create a GitHub oauth application](https://github.com/settings/applications/new) to be able to login. For `localhost` use `http://localhost:3000` and `http://localhost:3000/api/auth/callback/github` for Homepage and Authorization callback URL.

AI:

- `OPENAI_API_KEY`: you need to get a key from [OpenAI](https://platform.openai.com/)
- (optional) `RAPIDPAGES_UNSTABLE_STREAMING`: you can enable streaming generative UIs by setting this value to `true`. Streaming is only supported when deploying to Vercel Serverless or long running processes (eg. Docker). If deploying to Vercel you need to set `supportsResponseStreaming: true` manually in `pages/api/generate.ts` - this is because Next.js doesn't support dynamic config exports and this configuration option cannot depend on an environment variable.

#### Run Rapidpages on Host

Create the database & run the application

```bash
npm run db:push
npm run dev
```

#### Run Rapidpages on Docker

```bash
docker compose up -d
docker compose exec rapidpages npm run db:push
```

### Run Rapidpages Cloud

You can start using [Rapidpages](https://www.rapidpages.com) today on the cloud for free. If you run out of credits, feel free to ping us on [discord](https://discord.gg/W6jYq46Frd).

## Known Limitations

Currently, the components are generated in one shot. In the future, this task will be broken down into multiple steps such as dependency retrieval and icon generation. This multi-step process will allow the creation of more complicated ui elements.

## License

See the [LICENSE](LICENSE) file for more information.
