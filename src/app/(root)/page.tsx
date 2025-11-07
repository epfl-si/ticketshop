import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations, useMessages } from "next-intl";

export default function Info() {
	const translations = {
		about: useTranslations("info.about"),
		help: useTranslations("info.help"),
		faq: useTranslations("info.faq"),
		tech: useTranslations("info.tech")
	};
	const messages = useMessages();
	return (
		<div className="mx-auto p-6 space-y-6">
			<h2>{translations.about("title")}</h2>
			<p>
				{translations.about("paragraph1")}
			</p>
			<ul>
				{translations.about.rich("ul1",
					{
						li: (chunks) => <li>{chunks}</li>,
						i: (chunks) => <i>{chunks}</i>
					})}
			</ul>
			<p>
				{translations.about("paragraph2")}
			</p>
			<h2>{translations.help("title")}</h2>
			<p>
				{translations.help.rich("paragraph1", {
					a: (chunks) => <a className="text-primary" href="https://go.epfl.ch/KB0012580" target="_blank">{chunks}</a>
				})}
			</p>
			<p>
				{translations.help.rich("paragraph2", {
					i: (chunks) => <i>{chunks}</i>
				})}
			</p>
			<p>
				{translations.help.rich("paragraph3", {
					a: (chunks) => <a className="text-primary" href="https://go.epfl.ch/KB0012580" target="_blank">{chunks}</a>
				})}
			</p>
			<ul>
				<li>
					{translations.help("ul1li1")}
				</li>
				<li>
					{translations.help.rich("ul1li2", {
						i: (chunks) => <i>{chunks}</i>
					})}
				</li>
				<li>
					{translations.help("ul1li3")}
				</li>
				<li>
					{translations.help.rich("ul1li4", {
						a: (chunks) => <a className="text-primary" href={String(chunks).toLowerCase() === "GitHub" ? "https:/github.com/epfl-si/ticketshop" : "https:/github.com/epfl-si/ticketshop/issues"}>{chunks}</a>
					})}
				</li>
			</ul>
			<h2>{translations.tech("title")}</h2>
			<section className="w-full px-2">
				<Accordion type="single" collapsible className="mx-2">
					{Object.keys(messages.info.faq.questions).map((question) => (
						<AccordionItem value={question} key={question}>
							<AccordionTrigger>
								{translations.faq(`questions.${question}.title`)}
							</AccordionTrigger>
							<AccordionContent>
								{translations.faq.rich(
									`questions.${question}.description`,
									{
										LinkFAQ: (chunks) => (
											<a
												href={String(chunks).replaceAll(" ", "").toLowerCase() == "servicedesk" ? "mailto:1234@epfl.ch" : `https://go.epfl.ch/${chunks}`}
												className="text-primary hover:text-red-700 font-medium"
												target="_blank"
											>
												{chunks}
											</a>
										)
									},
								)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>
			<h2>{translations.tech("title")}</h2>
			<p>
				{translations.tech.rich("paragraph", { a: (chunks) => <a className="text-primary" href="https://nextjs.org/" target="_blank">{chunks}</a>})}
			</p>
			<section></section>
		</div>
	);
}
