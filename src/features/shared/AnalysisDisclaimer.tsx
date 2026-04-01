import { Badge, Paper, Stack, Text, Title } from '@mantine/core';

export default function AnalysisDisclaimer() {
  return (
    <Paper
      radius="xl"
      p={{ base: 20, sm: 24 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap="sm">
        <Badge color="yellow" variant="light" size="sm" tt="uppercase">
          Disclaimer
        </Badge>
        <Title order={3} fz="h4">
          This setup is only a helpful analysis tool
        </Title>
        <Text c="dimmed" size="sm" lh={1.7}>
          The setup numbers, trend, entry, TP, and SL shown on this page are meant to help you read market conditions,
          not to act as a guaranteed signal. Markets can change quickly, so do not rely too heavily on a single setup.
          Always check higher timeframes, volume, support / resistance, and risk management before making a decision.
        </Text>
        <Text c="dimmed" size="sm" lh={1.7}>
          In short: use this as an analysis helper, not as a certainty for entry.
        </Text>
      </Stack>
    </Paper>
  );
}
