let ArbProxy = artifacts.require("ArbProxy")

module.exports = async function (deployer, network) {
    try {
        await deployer.deploy(ArbProxy)
    } catch (e) {
        console.log(`Error in migration: ${e.message}`)
    }
}
