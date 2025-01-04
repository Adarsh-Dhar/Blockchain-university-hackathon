import { GetServerSideProps } from 'next';
import axios from 'axios';
import Image from 'next/image';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
  freeze_authority: string | null;
  mint_authority: string;
}

interface Props {
  tokens: Token[];
}

const TokensPage: React.FC<Props> = ({ tokens }) => {
  return (
    <div>
      <h1>All Tokens</h1>
      <ul>
        {tokens.map((token) => (
          <li key={token.address}>
            <Image src={token.logoURI} alt={token.name} width={50} height={50} />
            <p>{token.name} ({token.symbol})</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const response = await axios.get('https://tokens.jup.ag/tokens_with_markets');

    const tokens: Token[] = response.data;

    return { props: { tokens } };
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return { props: { tokens: [] } };
  }
};

export default TokensPage;