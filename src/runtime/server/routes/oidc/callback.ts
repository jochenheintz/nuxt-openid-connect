import { defineEventHandler, useCookie } from 'h3'

import { initClient } from '../../../utils/issueclient'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  console.log('oidc/callback calling')
  const { op, session } = useRuntimeConfig().openidConnect
  const issueClient = await initClient(op)
  const sessionid = useCookie(event, session.secret)
  console.log(sessionid)

  const req = event.req
  console.log(event.context.params)
  const params = issueClient.callbackParams(req)

  console.log(params)
  if (params.access_token) {
    const userinfo = await issueClient.userinfo(params.access_token)
    console.log(userinfo)
    return userinfo
  } else {
    console.log('empty callback')
    return {}
  }
})
