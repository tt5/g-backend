const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}
const tokens = new Set()
const users = new Set()
const usersOnline = new Set()
users.add('user')

fastify.register(require('fastify-cors'), { })
fastify.register(require('fastify-formbody'))
const leveldb = require('fastify-leveldb')
fastify.register(leveldb, { name: 'db' })
fastify.register(leveldb, { name: 'tokens' })
fastify.register(leveldb, { name: 'data' })

fastify.register(require('fastify-auth'))
fastify.register(require('fastify-basic-auth'), { validate, authenticate })

    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * 
   charactersLength));
     }
     return result;
    }

async function validate (username, password, req, reply) {
  console.log("login...")
  console.log("username: ", username)
  console.log(users.has(username))
  if (users.has(username)) {
    let valPassword = '';
    if (username === 'user') {
      valPassword = password
    } else {
      valPassword = await this.level.db.get(username)
    }
    console.log("login: ", username, valPassword)
    console.log("token: ", tokens.has(valPassword))
    if (username === 'user') {
      if (!tokens.has(valPassword)) {
        console.log("invalid token", valPassword)
        return new Error('invalid token')
      }
    } else {
      if (password !== valPassword) {
        return new Error('error')
      }
    }
    usersOnline.add(username)
  } else {
    console.log("new user", username, password)
    await this.level.db.put(username, password);
    await this.level.data.put(username, '{}');
    users.add(username)
    usersOnline.add(username)
  }
}

fastify.after(() => {
  // use preHandler to authenticate all the routes
  fastify.addHook('preHandler', fastify.auth([
    fastify.basicAuth,
  ]))

  fastify.route({
    method: 'GET',
    url: '/login',
    handler: async (req, reply) => {
     
    const newtoken = makeid(12);
    tokens.add(newtoken);
      console.log("new token: ", newtoken)
//    await this.level.tokens.put(newtoken, "timestamp");
      return {
        auth: 'ok', 
        token: newtoken,
      }
    }
  })

  fastify.route({
    method: 'GET',
    url: '/delete/:user/:token',
    handler: async (req, reply) => {
     
    console.log("param: ", req.params)
    const authuser = atob(req.headers.authorization.split(' ')[1]).split(':')[0]
      if (authuser !== req.params.user) { 
        return new Error('no username')
      }
    tokens.delete(req.params.token);
    usersOnline.delete(req.params.user);
    users.delete(req.params.user)
    await this.level.data.delete(username);
      return {
        auth: 'ok', 
      }
    }
  })

  fastify.route({
    method: 'GET',
    url: '/logout/:user/:token',
    handler: async (req, reply) => {
     
      console.log("param: ", req.params)
    tokens.delete(req.params.token);
    usersOnline.delete(req.params.user);
      return {
        auth: 'ok', 
      }
    }
  })

  fastify.get('/data/:user', async function (req, reply) {
      const mydata = await this.level.data.get(req.params.user)
    console.log("data: ", mydata)
      return { data: mydata }
  })

  fastify.get('/update/:user/:theme', async function (req, reply) {
      await this.level.data.put(req.params.user, JSON.stringify({theme: req.params.theme}))
      return { result: "ok" }
  })
})



fastify.listen(process.env.PORT || 3001, '0.0.0.0');
