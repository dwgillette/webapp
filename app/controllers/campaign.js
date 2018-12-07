const axios = require('axios');
var Campaign = require('../models/campaign');
var openstatesApiKey = require('../../conf/secrets.js').openstates_api_key;

var campaignController = {};

// not used for now, but we probably want to create a page for this
campaignController.findAllCampaigns = function (request, response) {
    if (request.user) {
        var campaigns = Campaign.find({});
        campaigns.then(function (result) {
            response.send(result);
        });
    } else {
        response.status(301).send({});
    }
};

campaignController.findLegislator = async function (latitude, longitude, campaignId, response) {
    var getRepresentative = function (legislators) {
        if (legislators.length === 0) {
            return null;
        }

        var legislator = legislators[0];
        legislator = {
            first_name: legislator.first_name,
            last_name: legislator.last_name,
            party: legislator.party,
            photo_url: legislator.photo_url,
            phone: legislator.offices.find(office => office.phone).phone
        };

        if (!legislator.phone) {
            return null;
        }
        return legislator;
    };

    var success = function (legislators) {
        var representative = getRepresentative(legislators);
        var representativeFound = (representative != null);
        var responseObject = {
            representativeFound: representativeFound,
            representativeInfo: representative
        };
        response.send(JSON.stringify(responseObject));
    };

    let currentCampaign = await Campaign.findById(campaignId, 'legislature_level');
    let legislatureLevels = Object.keys(currentCampaign.legislature_level).filter(lev => currentCampaign.legislature_level[lev]);
    let legislators = [];

    if (legislatureLevels.includes("state_senate")) {
        let res = await axios.get(`https://openstates.org/api/v1/legislators/geo/?lat=${latitude}&long=${longitude}&apikey=${openstatesApiKey}`)
            .catch(error => { console.log(error); });
        legislators.push(res.data[0]);
    }

    success(legislators);
};

module.exports = campaignController;
