const k8s = require("@kubernetes/client-node");
const { GoogleAuth } = require("google-auth-library");

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});

async function configCluster(projectId, gkeZone, clusterId) {
  const client = await auth.getClient();
  const res = await client.request({
    url: `https://container.googleapis.com/v1/projects/${projectId}/zones/${gkeZone}/clusters/${clusterId}`,
  });
  return res.data;
}

async function createK8SClient(projectId, gkeZone, clusterId, k8sApiType) {
  const cluster = await configCluster(projectId, gkeZone, clusterId);
  const authToken = await auth.getAccessToken();
  const clusterEndpoint = `https://${cluster.endpoint}`;
  const k8sClient = k8sApiType
    ? new k8sApiType(clusterEndpoint)
    : new k8s.CoreV1Api(clusterEndpoint);

  k8sClient.setDefaultAuthentication({
    applyToRequest: (opts) => {
      opts.ca = Buffer.from(cluster.masterAuth.clusterCaCertificate, "base64");
      if (!opts.headers) {
        opts.headers = [];
      }
      opts.headers.Authorization = `Bearer ${authToken}`;
    },
  });
  return k8sClient;
}

exports.createK8SClient = createK8SClient;
