//package com.boilerclasses
//
//import com.microsoft.aad.msal4j.*
//import com.nimbusds.jwt.SignedJWT
//import io.jooby.Environment
//import kotlinx.serialization.Serializable
//import kotlinx.serialization.json.JsonObject
//import kotlinx.serialization.json.buildJsonObject
//import kotlinx.serialization.json.jsonPrimitive
//import kotlinx.serialization.json.put
//import org.slf4j.Logger
//import java.net.URI
//import java.net.URLEncoder
//import java.security.MessageDigest
//
//class Auth(val db: DB, val log: Logger, val env: Environment) {
//    val client = ConfidentialClientApplication
//        .builder(env.getProperty("MSAL_CLIENT_ID")!!,
//            ClientCredentialFactory.createFromSecret(env.getProperty("MSAL_CLIENT_SECRET")!!))
//        .authority("https://login.microsoftonline.com/4130bd39-7c53-419c-b1e5-8758d6d63f21/")
//        .build()
//
//    val root = env.getProperty("ROOT_URL")!!
//    val redirectUrl = "$root/auth"
//
//    fun validateEmail(email: String): Boolean =
//        "^[A-Za-z0-9+_.-]+@purdue.edu\$".toRegex().matches(email)
//
//    fun redir(state: String, nonce: String) =
//        client.getAuthorizationRequestUrl(AuthorizationRequestUrlParameters
//            .builder(redirectUrl, setOf("User.Read"))
//            .state(state)
//            .nonce(db.hash(nonce).base64())
//            .responseMode(ResponseMode.FORM_POST)
//            .prompt(Prompt.SELECT_ACCOUNT)
//            .build()).toString()
//
//    suspend fun auth(code: String, ses: DB.SessionDB, nonce: String, state: String) =
//        try {
//            if (ses.state!=state)
//                throw APIErrTy.LoginErr.err("Bad state")
//            val authParams = AuthorizationCodeParameters
//                .builder(code, URI(redirectUrl)).scopes(setOf("User.Read")).build()
//
//            val res = client.acquireToken(authParams).get()
//            val claims = SignedJWT.parse(res.idToken()).jwtClaimsSet
//            val nonceHash = claims.getStringClaim("nonce").base64()
//
//            if (!MessageDigest.isEqual(nonceHash, db.hash(nonce)))
//                throw APIErrTy.LoginErr.err("Bad nonce")
//
//            if (!validateEmail(res.account().username()))
//                throw APIErrTy.LoginErr.err("Invalid email. Please login with your @purdue.edu email address")
//
//            ses.withEmail(res.account().username())
//        } catch(e: Exception) {
//            ses.remove()
//            throw e
//        }
//}