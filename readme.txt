Please use python 3.12


# AUTH0 SETUP

1. Create Auth Flow Rule (To Add Emails in JWT Access Tokens)

Go To Auth0 ( Actions -> Library -> Custom )
    - Click on "Create Action".
    - Select 'Build From Scratch'.
    - Enter Name Field = "Add Email To Access Token".
    - Choose Trigger = "Login/Post Login".

Enter Below Code (Replace Namespace With Something Unique Like (Domain, UUID), So It Creates an Unique Key in Token Object)
##################################################################################

exports.onExecutePostLogin = async (event, api) => {
  const crypto = require('crypto');
  const namespace = '1839ec16-85a3-49bb-a687-b2c61b29a80d';

  // Secret key (use a strong key and store it securely, e.g., in environment variables)
  const secretKey = event.secrets.SECRET_KEY;
  
  // Encryption function
  const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  };

  if (event.authorization) {
    // Encrypt the user's email
    const encryptedEmail = encrypt(event.user.email);
    api.accessToken.setCustomClaim(`${namespace}`, encryptedEmail);
  }

};

###################################################################################
    - Generate Encryption Key using generate_key.js file located in this project's directory

    - Finally, Click on Deploy.









2. Add Created Rule To The Auth Actions.
Go To Auth0 ( Actions -> Flows -> Login )
    - Click on Custom and Drag n Drop The Action You Created Earlier.
    - Also Create Environment Variable in Auth0-Secrets named "SECRET_KEY" Which Stores Your Encryption Key
    - You Can use This Command To Genrate Random Key
    openssl rand -hex 32
    - Finally, Apply :)







3. Create Auth0 Application For React Frontend
Go To Auth0 ( Applications -> Applications -> Click on "Create Application" )
   - Enter Any Name You Want
   - Select Single Page Web Application
   - Click on Create
    Application is Created, Let's Configure it
   - Go To Settings
   - Copy "Domain" and "Client ID" (We Need Them For Both Frontend and Backend)
   - Customize Your Logo (By Providing URL)
   - Enter "Application Login URI" = "your own https domain" or Just Leave Blank (For Local Environment Leave it Blank.)
   - Enter "Application Callback URI" = "http://localhost:5173" or "your own domain"
   - Enter "Application Logout URI" = "http://localhost:5173" or "your own domain"
   - Enter "Allowed Web Origins" = "http://localhost:5173" or "your own domain"
   - Finally, Save Changes :)







4. Create Auth0 API (To Get Audience, Which We Need To Generate Access Tokens)
Go To Auth0 ( Applications -> APIs -> Click on "Create API" )
   - Enter any Name You Want.
   - Enter Your (Custom Domain/Application Domain) in "Identifier Field" (This Identifier Will Be Used as Audience Parameter)
   - Finally, Click on Create.
   - Your API is Created :)






5. Make Sure You Have All The Necessary Parameters We Need To Setup AUTH0 in Our App (Both Front and Back)
    - Domain (From Application)
    - Client ID (From Application)
    - Audience (From API)
    - AUTH0_EMAIL_NAMESPACE (When Creating Post Login Auth Flow)

    In Above Example I Have Used "1839ec16-85a3-49bb-a687-b2c61b29a80d"
    so My AUTH0_EMAIL_NAMESPACE = "1839ec16-85a3-49bb-a687-b2c61b29a80d"
    I Hope You Got it, This Namespace Will Be Used as A Key in JWT JSON Object Which Points to Value Which is User's Email Address.
