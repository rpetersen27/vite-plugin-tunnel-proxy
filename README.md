# vite-plugin-tunnel-proxy

A vite plugin that (at least for me) solves the problem of developing locally with browser based tunnel proxies like [SwitchyOmega](https://github.com/FelisCatus/SwitchyOmega) and https.

## Usage

### 1. Install

```bash
yarn add --dev vite-plugin-tunnel-proxy
```

### 2. Configuration

#### 2.1 Create a certificate and configure vite

I recommend using [mkcert](https://github.com/FiloSottile/mkcert) to generate locally trusted certificates.

```bash
mkcert install
mkcert -key-file .ssh.local/key.pem -cert-file .ssh.local/cert.pem example.test localhost 127.0.0.1 ::1
```

And use them in the vite config:

```js
import { defineConfig } from 'vite'
import vitePluginTunnelProxy from 'vite-plugin-tunnel-proxy'

export default defineConfig({
  server: {
    https: {
      key: './.ssh.local/key.pem',
      cert: './.ssh.local/cert.pem'
    }
  },
  plugins: [
    vitePluginTunnelProxy()
  ],
})
```

#### 2.2 Configure SwitchyOmega

You can use whatever proxy you like, I prefer SwitchyOmega.

Create a new profile of the type `Proxy Profile` and configure it as follows:

| Protocol | Server | Port |
--- | --- | ---
| HTTP | localhost | 8080 |

Save and activate the profile (or add it to a Switch Profile). And voilà, application is being served on https://example.test with a valid certificate.
