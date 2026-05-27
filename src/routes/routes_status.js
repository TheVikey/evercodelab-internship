function setupStatusRoute(app) {
  app.get('/status', (req, res) => {
    res.status(200).send('ok');
  });
}

module.exports = setupStatusRoute;