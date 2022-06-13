import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin, resolveModule, createResolver } from '@nuxt/kit'
import defu from 'defu'
import { name, version } from '../package.json'

export type OidcProvider = {
  issuer: string,
  clientId: string,
  clientSecret: string,
  callbackUrl: string,
  scope: Array<string>
}

export type ConfigSession = {
  secret: string,
  cookie: {},
  cookiePrefix: string,
  maxAge: number
}

export interface ModuleOptions {
  addPlugin: boolean,
  op: OidcProvider,
  session: ConfigSession
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'openidConnect',
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    addPlugin: true,
    op: {
      issuer: '',
      clientId: '',
      clientSecret: '',
      callbackUrl: 'http://localhost:3000/oidc/cbt',
      scope: [
        'email',
        'profile',
        'address'
      ]
    },
    // express-session configuration
    session: {
      secret: 'oidc._sessionid', // process.env.OIDC_SESSION_SECRET
      cookie: {},
      cookiePrefix: '',
      maxAge: 24 * 60 * 60 // one day
    }
  },
  setup (options, nuxt) {
    // console.log(options.op)
    const { resolve } = createResolver(import.meta.url)
    const resolveRuntimeModule = (path: string) => resolveModule(path, { paths: resolve('./runtime') })

    nuxt.hook('nitro:config', (nitroConfig) => {
      // Add server handlers
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.handlers.push({
        method: 'get',
        route: '/oidc/status',
        handler: resolveRuntimeModule('./server/routes/oidc/status')
      })
      nitroConfig.handlers.push({
        method: 'get',
        route: '/oidc/login',
        handler: resolveRuntimeModule('./server/routes/oidc/login')
      })
      nitroConfig.handlers.push({
        method: 'get',
        route: '/oidc/logout',
        handler: resolveRuntimeModule('./server/routes/oidc/logout')
      })
      nitroConfig.handlers.push({
        method: 'get',
        route: '/oidc/callback',
        handler: resolveRuntimeModule('./server/routes/oidc/callback')
      })
      nitroConfig.handlers.push({
        method: 'get',
        route: '/oidc/user',
        handler: resolveRuntimeModule('./server/routes/oidc/user')
      })
      nitroConfig.handlers.push({
        method: 'get',
        route: '/oidc/cbt',
        handler: resolveRuntimeModule('./server/routes/oidc/cbt')
      })

      nitroConfig.externals = defu(typeof nitroConfig.externals === 'object' ? nitroConfig.externals : {}, {
        inline: [
          // Inline module runtime in Nitro bundle
          resolve('./runtime')
        ]
      })
    })

    // openidConnect config will use in server
    nuxt.options.runtimeConfig.openidConnect = {
      ...options as any
    }

    if (options.addPlugin) {
      const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
      nuxt.options.build.transpile.push(runtimeDir)
      addPlugin(resolve(runtimeDir, 'plugin'))
    }
  }
})
