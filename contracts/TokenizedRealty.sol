// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title A consumer contract for SmartZip API.
 * @author LinkPool.
 * @dev Uses @chainlink/contracts 0.4.2.
 */
contract TokenizedRealty is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;
    using SafeMath for uint256;

    bytes32 private immutable valuationSpecId;
    uint256 private immutable valuationFee;

    mapping(bytes32 => RequestInfo) public requestIdMap;

    error FailedTransferLINK(address to, uint256 amount);

    struct RequestInfo {
        uint256 propertyId;
        uint256 holderIndex;
    }

    struct HoldingInfo {
        uint256 valueAtPurchase;
        uint256 amountPurchased;
        address purchaserAddress;
    }

    struct PropertyToken {
        address owner;
        uint256 endDate;
        uint256 totalvalue;
        uint256 numberOfHolders;
        mapping(uint256 => HoldingInfo) holders;
    }

    // Users address mapped to single PropertyToken instance
    mapping(uint256 => PropertyToken) public propertyTokens;

    /* ========== CONSTRUCTOR ========== */
    /**
     * @param _link the LINK token address.
     * @param _oracle the Operator.sol contract address.
     */
    constructor(
        address _link,
        address _oracle,
        bytes32 _valuationSpecId,
        uint256 _valuationFee
    ) {
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        valuationSpecId = _valuationSpecId;
        valuationFee = _valuationFee;
    }

    /* ========== PUBLIC FUNCTIONS ========== */

    /**
     * @param _propertyId the id of the property
     * @param _endDate token life span
     * @param _totalvalue amount of value to tokenise
     */
    function createPropertyTokens(
        uint256 _propertyId,
        uint256 _endDate,
        uint256 _totalvalue
    ) public {
        PropertyToken storage propertyToken = propertyTokens[_propertyId];
        propertyToken.owner = msg.sender;
        propertyToken.endDate = _endDate;
        propertyToken.totalvalue = _totalvalue;
    }

    /**
     * @param _propertyId the id of the property
     * @param _amount amount of value to tokenise
     */
    function purchasePropertyTokens(uint256 _propertyId, uint256 _amount)
        public
    {
        // TODO: Take amount from user
        PropertyToken storage propertyToken = propertyTokens[_propertyId];
        propertyToken.holders[propertyToken.numberOfHolders] = HoldingInfo({
            valueAtPurchase: 0, // This will get replaced by AVM
            amountPurchased: _amount,
            purchaserAddress: msg.sender
        });
        propertyToken.numberOfHolders = propertyToken.numberOfHolders.add(1);
        // Get valuation of purchase
        getValuationForTokens(_propertyId, propertyToken.numberOfHolders);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
     * @param _propertyId the id of the property
     */
    function getValuationForTokens(uint256 _propertyId, uint256 _holderIndex)
        internal
    {
        Chainlink.Request memory req = buildChainlinkRequest(
            valuationSpecId,
            address(this),
            this.setValuationForTokens.selector
        );
        req.addUint("property_id", _propertyId);
        bytes32 requestId = sendChainlinkRequest(req, valuationFee);
        requestIdMap[requestId] = RequestInfo({
            propertyId: _propertyId,
            holderIndex: _holderIndex
        });
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    function setValuationForTokens(bytes32 _requestId, uint256 _valuation)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 propertyId = requestIdMap[_requestId].propertyId;
        uint256 holderIndex = requestIdMap[_requestId].holderIndex;
        PropertyToken storage propertyToken = propertyTokens[propertyId];
        propertyToken.holders[holderIndex].valueAtPurchase = _valuation;
    }

    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) external {
        cancelChainlinkRequest(
            _requestId,
            _payment,
            _callbackFunctionId,
            _expiration
        );
    }

    function fulfillAvmPrice(bytes32 _requestId, uint256 _avmPrice)
        external
        recordChainlinkFulfillment(_requestId)
    {
        // requestIdResult[_requestId] = _avmPrice;
    }

    /**
     * @notice Requests the property AVM price by property ID.
     * @dev Result format is a uint256.
     * @param _specId the jobID.
     * @param _payment the LINK amount in Juels (i.e. 10^18 aka 1 LINK).
     * @param _property_id the SmartZip property ID.
     */
    function requestAvmByPropertyId(
        bytes32 _specId,
        uint256 _payment,
        uint256 _property_id
    ) external {
        Chainlink.Request memory req = buildChainlinkRequest(
            _specId,
            address(this),
            this.fulfillAvmPrice.selector
        );
        req.addUint("property_id", _property_id);
        sendChainlinkRequest(req, _payment);
    }

    function setOracle(address _oracle) external {
        setChainlinkOracle(_oracle);
    }

    function withdrawLink(address payable _payee, uint256 _amount) external {
        LinkTokenInterface linkToken = LinkTokenInterface(
            chainlinkTokenAddress()
        );
        if (!linkToken.transfer(_payee, _amount)) {
            revert FailedTransferLINK(_payee, _amount);
        }
    }

    /* ========== EXTERNAL VIEW FUNCTIONS ========== */
    function getOracleAddress() external view returns (address) {
        return chainlinkOracleAddress();
    }
}
