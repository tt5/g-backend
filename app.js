const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}

fastify.register(require('fastify-cors'), { })

fastify.register(require('fastify-auth'))
fastify.register(require('fastify-basic-auth'), { validate, authenticate })
async function validate (username, password, req, reply) {
  if (username !== 'a' || password !== 'b') {
    return new Error('Winter is coming')
  }
}

fastify.after(() => {
  // use preHandler to authenticate all the routes
  fastify.addHook('preHandler', fastify.auth([fastify.basicAuth]))

  fastify.route({
    method: 'GET',
    url: '/',
    // use onRequest to authenticate just this one
    onRequest: fastify.auth([fastify.basicAuth]),
    handler: async (req, reply) => {
      return { auth: 'ok' }
    }
  })
})

fastify.listen(process.env.PORT || 3001, '0.0.0.0');
