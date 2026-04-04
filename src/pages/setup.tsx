import type { GetServerSideProps } from 'next';
import SetupPage from '@features/setup/view/pages/Setup.page';
import { HAS_BINANCE_CREDENTIALS } from '@configs/base.config';

export const getServerSideProps: GetServerSideProps = async () => {
  if (HAS_BINANCE_CREDENTIALS) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default SetupPage;
