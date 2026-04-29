const replicaSetName = 'rs0';
const memberHost = 'mongo:27017';
const timeoutMs = 60000;

function isNotInitialized(error) {
  const message = String(error?.message || error);
  return (
    error?.codeName === 'NotYetInitialized' ||
    message.includes('no replset config has been received')
  );
}

function isAlreadyInitialized(error) {
  const message = String(error?.message || error);
  return (
    error?.codeName === 'AlreadyInitialized' ||
    message.includes('already initialized')
  );
}

function getReplicaSetStatus() {
  try {
    return db.adminCommand({ replSetGetStatus: 1 });
  } catch (error) {
    if (isNotInitialized(error)) {
      return null;
    }
    throw error;
  }
}

try {
  const result = db.adminCommand({
    replSetInitiate: {
      _id: replicaSetName,
      members: [{ _id: 0, host: memberHost }],
    },
  });

  if (result.ok !== 1) {
    throw new Error(`rs.initiate failed: ${JSON.stringify(result)}`);
  }
} catch (error) {
  if (!isAlreadyInitialized(error)) {
    throw error;
  }
}

const deadline = Date.now() + timeoutMs;
let lastStatus = null;

while (Date.now() < deadline) {
  status = getReplicaSetStatus();
  lastStatus = status;
  const primaryReady =
    status?.ok === 1 &&
    status.set === replicaSetName &&
    Array.isArray(status.members) &&
    status.members.some(
      (member) => member.name === memberHost && member.stateStr === 'PRIMARY',
    );

  if (primaryReady) {
    print('Mongo replica set is ready');
    quit(0);
  }

  sleep(1000);
}

throw new Error(
  `Mongo replica set ${replicaSetName} did not become primary: ${JSON.stringify(
    lastStatus,
  )}`,
);
