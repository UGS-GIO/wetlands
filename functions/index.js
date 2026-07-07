const functions = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");

const clientId = defineSecret("ARCGIS_CLIENT_ID");
const clientSecret = defineSecret("ARCGIS_CLIENT_SECRET");

exports.getArcGISToken = functions
    .runWith({ secrets: [clientId, clientSecret] })
    .https.onRequest(async (req, res) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        try {
            const params = new URLSearchParams({
                client_id: clientId.value(),
                client_secret: clientSecret.value(),
                grant_type: "client_credentials",
                f: "json"
            });

            const response = await fetch(
                "https://utahdnr.maps.arcgis.com/sharing/rest/oauth2/token",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: params.toString()
                }
            );

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error("Token exchange failed:", error);
            res.status(500).json({ error: "Token exchange failed" });
        }
    });
