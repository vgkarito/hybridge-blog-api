// Configura variables de entorno
require('dotenv').config({ silent: true });

const express = require('express');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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