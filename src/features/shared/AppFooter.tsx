import { Group, Paper, Stack, Text } from '@mantine/core';
import { APP_VERSION } from '@configs/base.config';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <Paper
      radius="xl"
      p={{ base: 18, sm: 22 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap={6} align="center">
        <Text size="sm" c="dimmed" ta="center">
          © {year} fatihmuhamadridho. All rights reserved.
        </Text>
        <Group gap={8} wrap="wrap" justify="center">
          <Text size="xs" c="dimmed">
            Version
          </Text>
          <Text size="xs" fw={700}>
            {APP_VERSION ?? 'dev'}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}
