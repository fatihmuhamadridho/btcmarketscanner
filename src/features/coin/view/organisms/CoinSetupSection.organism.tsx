import { Card, Stack } from '@mantine/core';
import CoinSetupDetailCard from '../molecules/CoinSetupDetailCard.molecule';
import CoinSetupSectionHeader from '../molecules/CoinSetupSectionHeader.molecule';
import type {
  CoinDistanceFromEntryFormatter,
  CoinPriceLevelFormatter,
  CoinPriceZoneFormatter,
  CoinSetupDetail,
} from '../../interface/CoinView.interface';

type CoinSetupSectionProps = {
  formatDistanceFromEntry: CoinDistanceFromEntryFormatter;
  formatPriceLevel: CoinPriceLevelFormatter;
  formatPriceZone: CoinPriceZoneFormatter;
  longSetup: CoinSetupDetail;
  preferredSetup: Pick<CoinSetupDetail, 'direction' | 'grade' | 'label'>;
  shortSetup: CoinSetupDetail;
};

export default function CoinSetupSection({
  formatDistanceFromEntry,
  formatPriceLevel,
  formatPriceZone,
  longSetup,
  preferredSetup,
  shortSetup,
}: CoinSetupSectionProps) {
  return (
    <Card
      radius="xl"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <CoinSetupSectionHeader
        preferredDirection={preferredSetup.direction}
        preferredGrade={preferredSetup.grade}
        preferredLabel={preferredSetup.label}
      />

      <Stack gap="md" mt="md">
        <CoinSetupDetailCard
          formatDistanceFromEntry={formatDistanceFromEntry}
          formatPriceLevel={formatPriceLevel}
          formatPriceZone={formatPriceZone}
          setup={longSetup}
        />
        <CoinSetupDetailCard
          formatDistanceFromEntry={formatDistanceFromEntry}
          formatPriceLevel={formatPriceLevel}
          formatPriceZone={formatPriceZone}
          setup={shortSetup}
        />
      </Stack>
    </Card>
  );
}
