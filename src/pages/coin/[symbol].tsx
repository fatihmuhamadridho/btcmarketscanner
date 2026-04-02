import type { GetServerSideProps } from 'next';
import CoinPage from '@features/coin/view/pages/Coin.page';
import type { CoinPageProps } from '@features/coin/interface/CoinView.interface';

export const getServerSideProps: GetServerSideProps<CoinPageProps> = async (context) => {
  const symbol = typeof context.params?.symbol === 'string' ? context.params.symbol : undefined;

  return {
    props: {
      symbol,
    },
  };
};

export default function CoinRoutePage(props: CoinPageProps) {
  return <CoinPage {...props} />;
}
