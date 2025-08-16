import { useState } from 'react';
import Link from 'next/link';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CloseButton from 'react-bootstrap/CloseButton';
import Alert from 'react-bootstrap/Alert';
import ImageLoader from '../ImageLoader';
import PasswordToggle from '../PasswordToggle';
import { useAuth } from '../../hooks/useAuth';
import OAuthButtons from '../OAuthButtons';

const SignUpModalLight = ({ onSwap, pillButtons, ...props }) => {
  const { signUp, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

    // Check if all fields are filled
    const allFieldsFilled = name && email && password && confirmPassword;

    if (!form.checkValidity() || !allFieldsFilled ||
        password !== confirmPassword || !passwordPattern.test(password)) {
      event.stopPropagation();
      setValidated(true);

      // Only set form error if all fields are filled
      if (allFieldsFilled) {
        if (password !== confirmPassword) {
          setFormError('Passwords do not match.');
        } else if (!passwordPattern.test(password)) {
          setFormError('Password must contain one uppercase letter, one lowercase letter, and one number.');
        }
      } else {
        setFormError('');
      }

      return;
    }

    try {
      const response = await signUp(name, email, password);
      if (response.success) {
        props.onHide();
      } else {
        setFormError(response.error || 'An error occurred while signing up.');
      }
    } catch (error) {
      setFormError('An error occurred while signing up.');
    }
  };

  return (
      <Modal {...props} className="signup-modal">
        <Modal.Body className="px-0 py-2 py-sm-0">
          <CloseButton
              onClick={props.onHide}
              aria-label="Close modal"
              className="position-absolute top-0 end-0 mt-3 me-3"
          />
          <div className="row mx-0 align-items-center">
            <div className="col-md-6 border-end-md p-4 p-sm-5">
              <h2 className="h3 mb-4 mb-sm-5">Join Homefinder.<br />Get premium benefits:</h2>
              <ul className="list-unstyled mb-4 mb-sm-5">
                {['Add and promote your listings', 'Easily manage your wishlist', 'Leave reviews'].map((benefit, index) => (
                    <li className="d-flex mb-2" key={index}>
                      <i className="fi-check-circle text-primary mt-1 me-2"></i>
                      <span>{benefit}</span>
                    </li>
                ))}
              </ul>
              <div className="d-flex justify-content-center">
                <ImageLoader
                    src="/images/signin-modal/signup.svg"
                    width={344}
                    height={404}
                    alt="Illustration"
                />
              </div>
              <div className="mt-sm-4 pt-md-3">
                Already have an account? <a href="#" onClick={onSwap}>Sign in</a>
              </div>
            </div>
            <div className="col-md-6 px-4 pt-2 pb-4 px-sm-5 pb-sm-5 pt-md-5">
              <OAuthButtons pillButtons={pillButtons} />
              <div className="d-flex align-items-center py-3 mb-3">
                <hr className="w-100" />
                <div className="px-3">Or</div>
                <hr className="w-100" />
              </div>
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {formError && <Alert variant="danger" className="text-center">{formError}</Alert>}
                <Form.Group controlId="su-name" className="mb-4">
                  <Form.Label>Full name</Form.Label>
                  <Form.Control
                      placeholder="Enter your full name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="su-email" className="mb-4">
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
                  <Form.Label htmlFor="su-password">
                    Password
                  </Form.Label>
                  <PasswordToggle
                      id="su-password"
                      minLength="8"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  />
                  <Form.Text id='passwordHelpBlock'>Password must have minimum of 8 characters with uppercase, lowercase, and numbers only.</Form.Text>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label htmlFor="su-confirm-password">Confirm password</Form.Label>
                  <PasswordToggle
                      id="su-confirm-password"
                      minLength="8"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Form.Group>
                <Form.Check
                    type="checkbox"
                    id="terms-agree"
                    label={
                      <>
                        By joining, I agree to the <Link href="#">Terms of use</Link> and <Link href="#">Privacy policy</Link>
                      </>
                    }
                    required
                    className="mb-4"
                />
                <Button
                    type="submit"
                    size="lg"
                    variant={`primary ${pillButtons ? 'rounded-pill' : ''} w-100`}
                    disabled={isLoading}
                >
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </Button>
              </Form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
  );
};

export default SignUpModalLight;