// Configura variables de entorno
require('dotenv').config({ silent: true });

const express = require('express');
const db = require('./models');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Estrategia local (login con email y contraseña)
passport.use('local',
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) return done(null, false, { message: 'Usuario no existe' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return done(null, false, { message: 'Contraseña incorrecta' });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Estrategia JWT (protección de rutas)
passport.use('jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await db.User.findByPk(payload.id);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Registro
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await db.User.create({ name, email, password: hash });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
// Login - genera token JWT
app.post('/api/login',
  passport.authenticate('local', { session: false }),
  (req, res) => {
    const payload = { id: req.user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, token_type: 'Bearer' });
  }
);

// Ruta protegida: perfil del usuario
app.get('/api/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({ id: req.user.id, email: req.user.email, msg: 'Acceso concedido' });
  }
);

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Hybridge Blog Posts' });
});

// GET - Obtener todos los posts
app.get('/api/posts', async (req, res) => {
  const posts = await db.Post.findAll();
  res.json(posts);
});

// POST - Crear un nuevo post
app.post('/api/posts', async (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const newPost = await db.Post.create({ title, content, authorId: author });
  res.status(201).json(newPost);
});

// DELETE - Eliminar un post por ID
app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const post = await db.Post.findByPk(id);

  if (!post) {
    return res.status(404).json({ error: 'Publicación no encontrada' });
  }

  await post.destroy();
  res.status(204).send();
});
// POST - Crear un autor
app.post('/api/authors', async (req, res) => {
  const { name } = req.body;
  const author = await db.Author.create({ name });
  res.status(201).json(author);
});
// GET - Obtener un post por ID
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const post = await db.Post.findByPk(id);

  if (!post) {
    return res.status(404).json({ error: 'Publicación no encontrada' });
  }

  res.json(post);
});

// PATCH - Actualizar un post por ID
app.patch('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const post = await db.Post.findByPk(id);

  if (!post) {
    return res.status(404).json({ error: 'Publicación no encontrada' });
  }

  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  await post.save();
  res.json(post);
});
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});