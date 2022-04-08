async function getTaxiPrice(addrFrom, addrTo, taxiClass, apiClid, apiKey)
{
    const addrFromEncoded = encodeURIComponent(addrFrom);
    const addrToEncoded = encodeURIComponent(addrTo);

    const requestQuery = `https://taxi-routeinfo.taxi.yandex.net/taxi_info?clid=${apiClid}&apikey=${apiKey}&rll=${addrFromEncoded}~${addrToEncoded}&class=${taxiClass}`;

    const response = await fetch(requestQuery);
    if (response.status == 204 || response.status == 400)
    {
        return null;
    }
    else if (response.status > 299)
    {
        throw new Error(`Invalid response status: ${response.status}`);
    }

    const responseData = await response.json();
    
    return {
        price: responseData.options[0].price,
        currency: responseData.currency,
    };
}

module.exports = getTaxiPrice;