import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CloseButton from 'react-bootstrap/CloseButton';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import ImageLoader from '../ImageLoader';
import PasswordToggle from '../PasswordToggle';
import {useAuth} from '../../hooks/useAuth';
import OAuthButtons from '../OAuthButtons';

const SignInModalLight = ({ onSwap, pillButtons, ...props }) => {
  const router = useRouter();
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const [formError, setFormError] = useState('');
  const [isOAuthAccount, setIsOAuthAccount] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      setFormError('');
      setIsOAuthAccount(false);

      const response = await signIn(email, password);

      if (response.success) {
        props.onHide();
        router.push('/real-estate');
      } else {
        // Check if it's an OAuth account error
        if (response.error?.code === 'OAUTH_ACCOUNT_EXISTS') {
          setIsOAuthAccount(true);
          setFormError(response.error.message || 'This account uses social sign-in');
        } else {
          setFormError(response.error || 'An error occurred while signing in.');
        }
      }
    } catch (error) {
      console.error('SignIn error:', error);
      setFormError('An error occurred while signing in.');
    }
  };

  const handleOAuthPrompt = () => {
    setIsOAuthAccount(false);
    setFormError('');
    // Focus on OAuth buttons or scroll to them
    document.querySelector('.oauth-buttons')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
      <Modal {...props} className="signin-modal">
        <Modal.Body className="px-0 py-2 py-sm-0">
          <CloseButton
              onClick={props.onHide}
              aria-label="Close modal"
              className="position-absolute top-0 end-0 mt-3 me-3"
          />
          <div className="row mx-0 align-items-center">
            <div className="col-md-6 border-end-md p-4 p-sm-5">
              <h2 className="h3 mb-4 mb-sm-5">Hey there!<br />Welcome back.</h2>
              <div className="d-flex justify-content-center">
                <ImageLoader
                    src="/images/signin-modal/signin.svg"
                    width={344}
                    height={292}
                    alt="Illustration"
                />
              </div>
              <div className="mt-4 mt-sm-5">
                Don't have an account? <a href="#" onClick={onSwap}>Sign up here</a>
              </div>
            </div>
            <div className="col-md-6 px-4 pt-2 pb-4 px-sm-5 pb-sm-5 pt-md-5">
              {/* OAuth Buttons */}
              <div className="oauth-buttons">
                <OAuthButtons pillButtons={pillButtons} />
              </div>

              <div className="d-flex align-items-center py-3 mb-3">
                <hr className="w-100" />
                <div className="px-3">Or</div>
                <hr className="w-100" />
              </div>

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {/* OAuth Account Alert */}
                {isOAuthAccount && (
                    <Alert variant="info" className="text-center">
                      <div className="mb-2">
                        <i className="fi-info-circle me-2"></i>
                        <strong>Account found!</strong>
                      </div>
                      <p className="mb-3 small">
                        This email is associated with a Google or Apple account.
                        Please use the social sign-in buttons above.
                      </p>
                      <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={handleOAuthPrompt}
                      >
                        Use Social Sign-In
                      </Button>
                    </Alert>
                )}

                {/* Regular Error Alert */}
                {formError && !isOAuthAccount && (
                    <Alert variant="danger" className="text-center">
                      {formError}
                    </Alert>
                )}

                <Form.Group controlId="si-email" className="mb-4">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <Form.Label htmlFor="si-password" className="mb-0">Password</Form.Label>
                    <Link href="#" className="fs-sm">Forgot password?</Link>
                  </div>
                  <PasswordToggle
                      id="si-password"
                      placeholder="Enter password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

                <Button
                    type="submit"
                    size="lg"
                    variant={`primary ${pillButtons ? 'rounded-pill' : ''} w-100`}
                    disabled={isLoading}
                >
                  {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Signing in...
                      </>
                  ) : 'Sign in'}
                </Button>
              </Form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
  );
};

export default SignInModalLight;