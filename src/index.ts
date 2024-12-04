import { WebflowClient } from 'webflow-api';
import { CollectionItemList, CollectionList } from 'webflow-api/api';

/**
 * Env interface defining the necessary environment variables for the worker.
 */
export interface Env {
	attendlyCache: KVNamespace;
	ATTENDLY_SIDE_ID: string;
	WEBFLOW_ACCESS_TOKEN: string;
}

/**
 *
 * @param {string} key
 * @param {KVNamespace} KV
 * @returns {Promise<any>}
 */
const getDataFromCache = async (key: string, KV: KVNamespace): Promise<any> => {
	const cachedData = await KV.get(key);
	if (cachedData) return JSON.parse(cachedData);
	return null;
};

/**
 *
 * @param {string} key
 * @param {any} data
 * @param {KVNamespace} KV
 */
const setDataToCache = async (key: string, data: any, KV: KVNamespace): Promise<any> => {
	await KV.put(key, JSON.stringify(data), { expirationTtl: 120 });
};
/**
 * Creates and returns a WebflowClient instance.
 *
 * @param {Env} env - Environment configuration object containing the Webflow access token.
 * @returns An instance of WebflowClient configured with the provided access token.
 */
const getWebflowClient = (env: Env): WebflowClient => {
	return new WebflowClient({
		accessToken: env.WEBFLOW_ACCESS_TOKEN,
	});
};

/**
 * Fetches all collections for a given site ID using the Webflow client.
 *
 * @param {WebflowClient} client - The WebflowClient instance for API interaction.
 * @param {string} siteId - The ID of the site for which collections are fetched.
 * @returns A promise resolving to an object containing an array of WebflowCollection.
 */
const getAllCollections = async (client: WebflowClient, siteId: string): Promise<CollectionList> => {
	return await client.collections.list(siteId);
};

/**
 *
 * @param {WebflowClient} client
 * @param {string} collectionId
 * @returns A promise resolving to an object containing an array of WebflowCollection data.
 */
const getCollectionData = async (client: WebflowClient, collectionId: string): Promise<CollectionItemList> => {
	return await client.collections.items.listItemsLive(collectionId);
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// instantiating webflow client & KV storage
		const client = getWebflowClient(env);
		const KV = env.attendlyCache;

		// check if data is cached already and if it exists return that data from the cache itself
		const cacheKey = `blogs_${env.ATTENDLY_SIDE_ID}`;
		const cachedBlogs = await getDataFromCache(cacheKey, KV);

		const headerOptions = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
		};
		if (cachedBlogs) return new Response(JSON.stringify(cachedBlogs), { headers: headerOptions });

		// formatting data
		const { collections } = await getAllCollections(client, env.ATTENDLY_SIDE_ID);

		// filtering only blog collections
		const blogCollections = collections?.filter((cl) => cl.displayName?.includes('Blog'));

		// getting all collection slugs
		const collectionSlug = blogCollections?.map((cl) => cl.slug);

		// filtering author collection
		const authorCollection = collections?.find((cl) => cl.displayName === 'Authors');

		// fetching author collection items
		const authorCollectionItem = (await getCollectionData(client, authorCollection?.id!)).items;

		// creating map of authorIds and name for mapping each author name with it's id
		const authorIdMap = new Map(authorCollectionItem?.map((it) => [it.id, it.fieldData?.name]));

		// fetching data of all blog collections
		const blogCollectionItems = await Promise.all(
			blogCollections!.map(async (cl) => {
				const items = (await getCollectionData(client, cl.id!)).items;
				return items?.map((it) => ({
					...it,
					parentSlug: cl.slug,
				}));
			})
		);
		const allBlogs = blogCollectionItems.flatMap((cl) => cl);

		// mapping blog with author and returning on desired data
		const blogWithAuthors = allBlogs.map((blog) => {
			const authorName = authorIdMap.get(blog?.fieldData?.author);
			const blogSlug = `/blog/afterschool-programs/${blog?.parentSlug}/${blog?.fieldData?.slug}`;
			return {
				name: blog?.fieldData?.name,
				summary: blog?.fieldData?.summary,
				slug: blogSlug,
				author: authorName,
				date: blog?.fieldData?.['date-published'],
			};
		});

		console.log(blogWithAuthors);

		// setting request data in the cache
		await setDataToCache(cacheKey, blogWithAuthors, KV);

		return new Response(JSON.stringify(blogWithAuthors), { headers: headerOptions });
	},
} satisfies ExportedHandler<Env>;
