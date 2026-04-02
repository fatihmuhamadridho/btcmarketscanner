import { Badge, Card, SimpleGrid, Stack, Text } from '@mantine/core';

type SetupPathStep = {
  label: string;
  status: 'done' | 'current' | 'pending';
};

type CoinSetupPathGridProps = {
  path: SetupPathStep[];
  setupColor: 'teal' | 'red';
};

export default function CoinSetupPathGrid({ path, setupColor }: CoinSetupPathGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
      {path.map((step) => {
        const stepColor = step.status === 'done' ? setupColor : step.status === 'current' ? 'yellow' : 'gray';

        return (
          <Card
            key={step.label}
            radius="md"
            p={{ base: 'xs', sm: 'sm' }}
            withBorder
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Stack gap={4}>
              <Badge variant="light" color={stepColor}>
                {step.status === 'done' ? 'Done' : step.status === 'current' ? 'Now' : 'Wait'}
              </Badge>
              <Text size="xs" c="dimmed" lh={1.35}>
                {step.label}
              </Text>
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
