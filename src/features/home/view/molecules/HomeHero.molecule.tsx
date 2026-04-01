import { Badge, Stack, Text, Title } from '@mantine/core';

type HomeHeroProps = {
  badgeLabel: string;
  description: string;
  title: string;
};

export default function HomeHero({ badgeLabel, description, title }: HomeHeroProps) {
  return (
    <Stack gap="sm" maw={760}>
      <Badge color="teal" variant="light" size="lg" tt="uppercase">
        {badgeLabel}
      </Badge>
      <Title order={1} maw={720} lh={0.95} fw={700}>
        {title}
      </Title>
      <Text c="dimmed" fz="lg" maw={760} lh={1.7}>
        {description}
      </Text>
    </Stack>
  );
}
