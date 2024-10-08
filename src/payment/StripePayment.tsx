import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from './CheckoutForm';

function StripePayment({ clientSecret, userDetails }: { clientSecret: string | null, userDetails: { [key: string]: string | number } }) {
   const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK as string);

   return (
      <>
         {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret, }}>
               <CheckoutForm userDetails={userDetails} />
            </Elements>
         )}
      </>
   );
}

export default StripePayment;