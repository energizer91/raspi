const queue = {};

function addMessage(uuid, callback, timeout = 10000) {
  const errorTimeout = setTimeout(() => rejectMessage(uuid, new Error('Operation timeout')), timeout);

  queue[uuid] = {
    callback,
    timeout,
    errorTimeout
  };
}

function resolveMessage(uuid, data) {
  queue[uuid].callback(null, data);

  deleteMessage(uuid);
}

function rejectMessage(uuid, error) {
  queue[uuid].callback(error);

  deleteMessage(uuid);
}

function deleteMessage(uuid) {
  if (queue[uuid].errorTimeout) {
    clearTimeout(queue[uuid].errorTimeout);
  }

  delete queue[uuid];
}

function hasQueue(uuid) {
  return queue[uuid];
}

module.exports = {
  addMessage,
  resolveMessage,
  hasQueue
};
