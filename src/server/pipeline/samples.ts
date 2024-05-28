export const samples = [
{
      "query": "generate a landing page for a browser extension chatbot. make it compelling and selling.",
      "components": "shadcn"
    },
    {
      query: "make hero section two column and add hero image on the 2nd column.",
      components: "shadcn",
      "code": `
      //landing-page.tsx
      import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
      import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
      import { Button } from '@/components/ui/button';
      import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
      import { Input } from '@/components/ui/input';
      import { Separator } from '@/components/ui/separator';
      
      export default function LandingPage() {
        return (
          <div className="container mx-auto p-4">
            <header className="text-center my-8">
              <h1 className="text-4xl font-bold mb-4">Welcome to ChatBot Extension</h1>
              <p className="text-lg text-gray-600">Enhance your browsing experience with our AI-powered chatbot extension.</p>
              <Button className="mt-4">Download Now</Button>
            </header>
      
            <Separator className="my-8" />
      
            <section className="my-8">
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Feature One</AccordionTrigger>
                  <AccordionContent>
                    Our chatbot provides real-time assistance and answers to your queries.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Feature Two</AccordionTrigger>
                  <AccordionContent>
                    Seamlessly integrates with your browser for a smooth experience.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Feature Three</AccordionTrigger>
                  <AccordionContent>
                    Customizable settings to tailor the chatbot to your needs.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
      
            <Separator className="my-8" />
      
            <section className="my-8">
              <h2 className="text-2xl font-semibold mb-4">Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Benefit One</CardTitle>
                    <CardDescription>Save time and increase productivity.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>With our chatbot, you can get instant answers without leaving your current tab.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Benefit Two</CardTitle>
                    <CardDescription>24/7 Availability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Our chatbot is always available to assist you, no matter the time of day.</p>
                  </CardContent>
                </Card>
              </div>
            </section>
      
            <Separator className="my-8" />
      
            <section className="my-8 text-center">
              <Alert>
                <AlertTitle>Ready to get started?</AlertTitle>
                <AlertDescription>
                  Download our chatbot extension now and transform your browsing experience.
                </AlertDescription>
              </Alert>
              <Button className="mt-4">Download Now</Button>
            </section>
      
            <Separator className="my-8" />
      
            <section className="my-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <div className="max-w-md mx-auto">
                <Input type="email" placeholder="Your email" className="mb-4" />
                <Button className="w-full">Subscribe</Button>
              </div>
            </section>
          </div>
        );
      }
`
    },
    {
      "query": "generate a landing page for a browser extension chatbot. make it compelling and selling.",
      "components": "nextui",
    },
  ]