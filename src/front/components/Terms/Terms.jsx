import './Terms.css';

/**
 * TermsText — renderiza el contenido de Términos y Condiciones.
 * Sin Bootstrap modal; se usa inline dentro del formulario de registro.
 */
export const TermsText = () => (
  <div className="terms-text-content">
    <p>
      Welcome to PlayerLink, our platform for connecting gamers. By registering,
      you agree to the following terms. Please read them carefully.
    </p>

    <h6>1. Service Description</h6>
    <p>
      Our platform helps users discover and connect with other gamers based on
      shared interests, using details such as Steam ID, Discord username,
      language, zodiac sign, play style, and approximate location.
    </p>

    <h6>2. Privacy and Data Protection</h6>
    <p>
      All information provided will be handled according to our Privacy Policy.
      We will never share your Steam or Discord credentials with third parties
      without your consent.
    </p>

    <h6>3. User Conduct</h6>
    <p>
      Using the platform to harass, deceive, or harm other users is strictly
      prohibited. Toxic, racist, offensive, or fraudulent behaviour may result
      in account suspension or permanent ban.
    </p>

    <h6>4. Third-Party Integration</h6>
    <p>
      By connecting your Steam and Discord accounts, you authorise the app to
      access basic profile data to enhance the matchmaking experience.
    </p>

    <h6>5. Changes to the Service</h6>
    <p>
      We reserve the right to modify or discontinue the service at any time,
      with or without notice.
    </p>

    <h6>6. Account Deletion</h6>
    <p>
      You may delete your account at any time from your settings. We also
      reserve the right to suspend your access if you violate these terms.
    </p>

    <h6>7. Limitation of Liability</h6>
    <p>
      We are not responsible for any interactions that occur outside of the app,
      nor for disputes between users. Use the service at your own risk.
    </p>

    <p className="terms-contact">
      Questions? Contact us at{' '}
      <a href="mailto:support@playerlink.com">support@playerlink.com</a>
    </p>
  </div>
);
