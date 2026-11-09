const users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    createdAt: new Date().toISOString()
  }
];

function getUsers() {
  return users.map((user) => ({ ...user }));
}

function getUserById(id) {
  return users.find((user) => user.id === Number(id));
}

function createUser({ name, email }) {
  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name,
    email,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  return { ...newUser };
}

module.exports = {
  getUsers,
  getUserById,
  createUser
};
