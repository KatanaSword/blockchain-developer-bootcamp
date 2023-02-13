const config = require('../src/config.json')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
    // Fetch accounts from wallet - these are unlocked
    const accounts = await ethers.getSigners()

    // Fetch network
    const { chainId } = await ethers.provider.getNetwork()
    console.log("Using chainId:", chainId)

    // Fetch deployer tokens
    const SAH = await ethers.getContractAt('Token', config[chainId].SAH.address)
    console.log(`SAH Token fetched: ${SAH.address}\n`)

    const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
    console.log(`mETH Token fetched: ${mETH.address}\n`)

    const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
    console.log(`mDAI Token fetched: ${mDAI.address}\n`)

    // Fetch the deployed exchange
    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
    console.log(`Exchange fetched: ${exchange.address}\n`)

    // Give tokens to account[1]
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)

    // user1 transfers 10,000 mETH...
    let transaction, result
    transaction = await mETH.connect(sender).transfer(receiver.address, amount)
    console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

    // Set up exchange users 
    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)

    // user1 approves 10,000 SAH...
    transaction = await SAH.connect(user1).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user1.address}\n`)

    // user1 deposits 10,000 SAH...
    transaction = await exchange.connect(user1).depositToken(SAH.address, amount)
    await transaction.wait()
    console.log(`Deposited ${amount} Ether from ${user1.address}\n`)

    // user2 approves mETH
    transaction = await mETH.connect(user2).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user2.address}\n`)

    // user2 deposits mETH
    transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
    await transaction.wait()
    console.log(`Deposited ${amount} tokens from ${user2.address}\n`)

    ///////////////////////////////////////////////////////
    // Seed a Cancelled Order
    //

    // User1 makes order to get tokens
    let orderId
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), SAH.address, tokens(5))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}\n`)

    // User1 Cancels order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user1).cancelOrder(orderId)
    result = await transaction.wait()
    console.log(`Cancalled order from ${user1.address}\n`)

    // Wait 1 second
    await wait(1)
    
    ///////////////////////////////////////////////////////
    // Seed Filled Orders
    //

    // User1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), SAH.address, tokens(10))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}\n`)

    // User2 filled order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}\n`)

    // Wait 1 second
    await wait(1)

    // User1 makes another order
    transaction = await exchange.makeOrder(mETH.address, tokens(50), SAH.address, tokens(15))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}\n`)

    // User2 fills another order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}\n`)

    // Wait 1 second
    await wait()

    // User1 makes final order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), SAH.address, tokens(20))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}\n`)

    // User2 fills final order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}\n`)

    // Wait 1 second
    await wait(1)

    ///////////////////////////////////////////////////////
    // Seed Open Orders
    //

    // User1 makes 10 orders
    for(let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), SAH.address, tokens(10))
        result = await transaction.wait()
        console.log(`Made order from ${user1.address}\n`)

        // Wait 1 second
        await wait(1)
    }

    // User2 makes 10 orders
    for(let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user2).makeOrder(SAH.address, tokens(10), mETH.address, tokens(10 * i))
        result = await transaction.wait()
        console.log(`Made order from ${user2.address}\n`)

        // Wait 1 second
        await wait(1)
    }
}    

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
