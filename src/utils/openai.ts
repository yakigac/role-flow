import { Configuration, OpenAIApi } from "openai";

function getTreeLabels(parentLabels: string[]): string {
  return parentLabels.join(" > ");
}

export async function fetchGPTLabels(
  apiKey: string,
  parentLabels: string[]
): Promise<string[]> {
  const configuration = new Configuration({
    apiKey: apiKey, // Update to use userSettings.apiKey
  });
  const openai = new OpenAIApi(configuration);

  console.log("parentLabels", parentLabels);
  const treeLabels = getTreeLabels(parentLabels);
  const prompt = `## あなたの役割：
  あなたは与えられた役割に対し、ツリー構造を作って役割の分割を行います。
  目的は、役割をMECEに分担し、単純化することで、その役割を担う人が具体的な作業を行いやすくすることです。
  
  ## 過去の作業情報
  現時点までの分解状況は以下の通りです。
  ただし、あなたに知らされているのは次に分解する役割から、直系に根まで辿れる役割のみです。横の役割は含んでいません。
  ${treeLabels}
  
  ## 業務命令
  過去の作業状況を踏まえて、与えられた役割を出来る限りMECEかつ具体的な役割に分割してください。
  分割後の役割は、必ず3つにする必要があります。
  出力は下記例のようにカンマ区切りにしてください。
  
  ## 出力例
  * 分割後の役割1
  * 分割後の役割2
  * 分割後の役割3
  
  ## 開始！

  （続きから記載してください。）
  ${parentLabels[parentLabels.length - 1]}を以下の三つに分割します。
  * `;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = completion.data.choices[0]?.message?.content || "";
    console.log("response:", responseText);
    const fetchedLabels = responseText
      .trim()
      .split("*")
      .map((label) => label.trim());
    return fetchedLabels;
  } catch (error) {
    if (error.response) {
      console.error(
        `【error ${error.response.status}】 ${error.response.data.error.message}`
      );
      return ["Error", "Error", "Error"];
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return ["Error", "Error", "Error"];
    }
  }
}
