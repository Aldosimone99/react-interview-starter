import { Link, useParams } from "react-router-dom";
import { fetchJobById } from "../features/jobs/api";
import { useAsync } from "../hooks/useAsync";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function JobDetail() {
  const { id } = useParams();
  const jobId = Number(id);

  const state = useAsync(
    (signal) => fetchJobById(jobId, signal),
    [jobId]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Link className="text-sm text-white/70 hover:text-white" to="/jobs">
          ← Back to Jobs
        </Link>
      </div>

      {state.status === "loading" ? (
        <Card>
          <CardHeader title="Loading..." subtitle="Fetching job details" />
          <CardBody />
        </Card>
      ) : state.status === "error" ? (
        <Card>
          <CardHeader
            title="Failed to load"
            subtitle={state.error.message}
            right={<Badge variant="danger">Error</Badge>}
          />
          <CardBody />
        </Card>
      ) : state.status === "success" ? (
        state.data ? (
          <Card>
            <CardHeader
              title={state.data.title}
              subtitle={`${state.data.company} • ${state.data.location}`}
              right={<Badge variant="default">{state.data.level}</Badge>}
            />
            <CardBody>
              <div className="space-y-2 text-sm text-white/75">
                <p><span className="text-white/90">ID:</span> {state.data.id}</p>
                <p><span className="text-white/90">Level:</span> {state.data.level}</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Not found" subtitle="Job does not exist." right={<Badge variant="warning">404</Badge>} />
            <CardBody />
          </Card>
        )
      ) : null}
    </div>
  );
}