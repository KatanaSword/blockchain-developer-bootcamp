import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config.json';

import { 
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
  loadAllOrders,
  subscribeToEvents
} from '../store/interactions';

import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';

function App() {
  const dispatch = useDispatch()
 
  const loadBlockchainData = async () => {
    // Connect Ethers to blockchain
    const provider = loadProvider(dispatch)

    //Fetch current network's chainId (e.g. haedhat: 31337, goerli: 5)
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    // Fetch current account & balance from Metamask when changed
    window.ethereum.on('accountsChanged', () => {
      loadAccount(provider, dispatch)
    })
  
    // Load Token Smart Contract
    const SAH = config[chainId].SAH
    const mETH = config[chainId].mETH
    await loadTokens(provider, [SAH.address, mETH.address], dispatch)

    // Load Exchange smart Contract
    const exchangeConfig = config[chainId].exchange
    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)

    // Fetch all orders: open, filled, cancelled
    loadAllOrders(provider, exchange, dispatch)

    // Listen to events
    subscribeToEvents(exchange, dispatch)
  }

    useEffect(() => {
      loadBlockchainData()
    })
  
  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          <Order /> 

        </section>
        <section className='exchange__section--right grid'>

          <PriceChart />

          {/* Transactions */}

          {/* Trades */}

          <OrderBook />

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
 
