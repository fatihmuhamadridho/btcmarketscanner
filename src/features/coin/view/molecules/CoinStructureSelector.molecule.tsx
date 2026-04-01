import { SegmentedControl } from '@mantine/core';

type CoinStructureSelectorProps<TValue extends string> = {
  data: ReadonlyArray<{
    label: string;
    value: TValue;
  }>;
  value: TValue;
  onChange: (value: TValue) => void;
};

export default function CoinStructureSelector<TValue extends string>({
  data,
  value,
  onChange,
}: CoinStructureSelectorProps<TValue>) {
  return (
    <SegmentedControl
      data={[...data]}
      value={value}
      onChange={(nextValue) => onChange(nextValue as TValue)}
      fullWidth
      radius="xl"
      size="sm"
      styles={{
        root: {
          backgroundColor: 'transparent',
          padding: 0,
        },
        indicator: {
          backgroundColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
        },
        control: {
          borderRadius: 999,
        },
        label: {
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
        },
      }}
    />
  );
}
