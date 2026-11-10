import { Card, Skeleton, Stack, Text, useNullplatform, usePluginContext, useQuery } from "@nullplatform/ui-plugin-sdk";

interface Application {
  id: number;
  name: string;
  status?: string;
}

/**
 * The application's name and status, from the public API. The call is allowed
 * because manifest.json declares `GET /application/{id}`; any other is refused.
 */
export function Summary() {
  const context = usePluginContext();
  const np = useNullplatform();
  const applicationId = context.application?.id;
  const application = useQuery<Application | undefined>(
    async () => (applicationId ? np.api.get<Application>(`/application/${applicationId}`) : undefined),
    [applicationId],
  );

  if (application.loading) {
    return <Skeleton height={80} />;
  }
  return (
    <Card>
      <Stack spacing={1}>
        <Text variant="h6">{application.data?.name ?? "No application"}</Text>
        <Text variant="body2">Status: {application.data?.status ?? "unknown"}</Text>
      </Stack>
    </Card>
  );
}
