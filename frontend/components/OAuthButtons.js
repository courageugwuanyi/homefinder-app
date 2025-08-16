import { useSignIn, useUser } from "@clerk/nextjs";
import Button from 'react-bootstrap/Button';
import Spinner from "react-bootstrap/Spinner";
import { useRouter } from "next/router";

const OAuthButtons = ({ pillButtons, onswap }) => {
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { isSignedIn, isLoaded: userLoaded } = useUser();
    const router = useRouter();

    const handleOAuthSignIn = async (strategy) => {
        if (isSignedIn) {
            router.push("/auth/callback");
            return;
        }

        const currentPage = router.asPath;
        sessionStorage.setItem('preAuthPage', currentPage);

        await signIn.authenticateWithRedirect({
            strategy,
            redirectUrl: '/auth/callback'
        });

    };

    if (!signInLoaded || !userLoaded) {
        return (
            <div className="text-center">
                <Spinner animation='border' size='sm' className='me-2' />
                Loading...
            </div>
        );
    }

    return (
        <>
            <Button
                variant={`outline-danger ${pillButtons ? 'rounded-pill' : ''} w-100 mb-3`}
                onClick={() => handleOAuthSignIn('oauth_google')}
            >
                <i className='fi-google fs-lg me-1'></i>
                Sign in with Google
            </Button>
            <Button
                variant={`outline-danger ${pillButtons ? 'rounded-pill' : ''} w-100 mb-3`}
                onClick={() => handleOAuthSignIn('oauth_apple')}
            >
                <i className='fi-apple fs-lg me-1'></i>
                Sign in with Apple
            </Button>
        </>
    );
};

export default OAuthButtons;