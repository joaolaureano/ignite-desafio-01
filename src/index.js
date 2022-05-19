const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);
  if (!user) return response.status(404).json({ error: "User not found!" });

  request.user = user;
  return next();
}

function getTodoByUser(user, idTodo) {
  const todoRef = user.todos.find((todo) => todo.id === idTodo);
  if (!todoRef) {
    return undefined;
  }
  return todoRef;
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;
  const user = {
    name,
    username,
    id: uuidv4(),
    todos: [],
  };
  const userAlreadyExists = users.some((user) => user.username === username);
  if (userAlreadyExists) {
    return response.status(400).json({ error: "Username already exists!" });
  }

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    created_at: new Date(),
    done: false,
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;
  const { id } = request.params;

  const todoRef = getTodoByUser(user, id);

  if (!todoRef) {
    return response.status(404).json({ error: "Todo does not exists!" });
  }
  todoRef.title = title;
  todoRef.deadline = new Date(deadline);

  return response.status(200).json(todoRef);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const todoRef = getTodoByUser(user, id);
  if (!todoRef) {
    return response.status(404).json({ error: "Todo does not exists!" });
  }

  todoRef.done = true;

  return response.status(200).json(todoRef);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const todoRef = getTodoByUser(user, id);
  if (!todoRef) {
    return response.status(404).json({ error: "Todo does not exists" });
  }

  user.todos.splice(todoRef, 1);

  return response.status(204).send();
});

module.exports = app;
