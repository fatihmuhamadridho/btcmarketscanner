import type { GetServerSideProps } from 'next';
import CoinPage from '@features/coin/view/pages/Coin.page';
import type { CoinPageProps } from '@features/coin/interface/CoinView.interface';
import { HAS_BINANCE_CREDENTIALS } from '@configs/base.config';

export const getServerSideProps: GetServerSideProps<CoinPageProps> = async (context) => {
  if (!HAS_BINANCE_CREDENTIALS) {
    return {
      redirect: {
        destination: '/setup',
        permanent: false,
      },
    };
  }

  const symbol = typeof context.params?.symbol === 'string' ? context.params.symbol : undefined;

  return {
    props: {
      symbol,
    },
  };
};

export default function CoinRoutePage(props: CoinPageProps) {
  return <CoinPage key={props.symbol ?? 'unknown'} {...props} />;
}
