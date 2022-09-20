const healthz = (req, rsp) => {
  rsp.sendStatus(200);
};

module.exports = {
  healthz,
};
