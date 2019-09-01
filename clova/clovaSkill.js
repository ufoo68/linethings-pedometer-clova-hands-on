'use strict';
const clova = require('@line/clova-cek-sdk-nodejs');
const cache = require('memory-cache');//ハンズオンなのでいったんmemory-cache、本来はちゃんとDB的なの使うべき

const REPROMPT_MSG = '歩数から健康チェックを行いますか？';
const HELTHCHECK_THRESHOLD = 3

module.exports = clova.Client
  .configureSkill()

  //起動時
  .onLaunchRequest(async responseHelper => {
    console.log('onLaunchRequest');
    const speech = [
      clova.SpeechBuilder.createSpeechText('こんにちは！教えてほしいのへようこそ。'),
    ];
    const {userId} = responseHelper.getUser();
    console.log("userid=" + userId);
    const pedometerInfo = cache.get(userId)
    
    if(pedometerInfo){
      console.log("stepcount=" + pedometerInfo.stepcount);
      const steps = pedometerInfo.stepcount;
      responseHelper.setSessionAttributes({ "steps": steps });
    
      speech.push(clova.SpeechBuilder.createSpeechText('今日の成果は' + steps + '歩でした。'));
      speech.push(clova.SpeechBuilder.createSpeechUrl('https://www.dl.dropboxusercontent.com/s/ct1kak7abnjeppu/trumpet1.mp3?dl=0'));
      speech.push(clova.SpeechBuilder.createSpeechText('すごいいっぱい歩きましたね！その調子です！' + REPROMPT_MSG));
      responseHelper.setReprompt(getRepromptMsg(clova.SpeechBuilder.createSpeechText(REPROMPT_MSG)));
    }else{
      speech.push(clova.SpeechBuilder.createSpeechText('今日はまだ歩いていないようです。がんばりましょう！'));
      responseHelper.endSession();
    }
    
    responseHelper.setSpeechList(speech);
    
  
  })

  //ユーザーからの発話が来たら反応する箇所
  .onIntentRequest(async responseHelper => {
    const intent = responseHelper.getIntentName();
    console.log('Intent:' + intent);
    switch (intent) {
      // ヘルプ
      case 'Clova.GuideIntent':
        const helpSpeech = [
          clova.SpeechBuilder.createSpeechText('スキルの説明をします。あなたの歩数をお教えします。'),
          clova.SpeechBuilder.createSpeechText(REPROMPT_MSG)
        ];
        responseHelper.setSpeechList(helpSpeech);
        responseHelper.setReprompt(getRepromptMsg(clova.SpeechBuilder.createSpeechText(REPROMPT_MSG)));
        break;
      
      case 'Clova.YesIntent':
      case 'ExtensionYesIntent':
        const reqSessionAttributes = responseHelper.getSessionAttributes();
        const steps = reqSessionAttributes.steps;
        const yesSpeech = [];
        if (HELTHCHECK_THRESHOLD < steps){
          yesSpeech.push(clova.SpeechBuilder.createSpeechText('健康そのものです！このまま続けていきましょうね。'))
        } else {
          yesSpeech.push(clova.SpeechBuilder.createSpeechText('運動不足のようです。！もう少し頑張りましょうね。'))
        }
        yesSpeech.push(clova.SpeechBuilder.createSpeechText('また歩数の成果が知りたいときは呼んでくださいね！'))
        responseHelper.setSpeechList(yesSpeech);
        responseHelper.endSession();
        break;
      case 'Clova.NoIntent':
      case 'ExtensionNoIntent':
        const noSpeech = [
          clova.SpeechBuilder.createSpeechText('また歩数の成果が知りたいときは呼んでくださいね！')
        ];
        responseHelper.setSpeechList(noSpeech);
        responseHelper.endSession();
        break;
        
      default:
        responseHelper.setSimpleSpeech(clova.SpeechBuilder.createSpeechText(REPROMPT_MSG));
        responseHelper.setReprompt(getRepromptMsg(clova.SpeechBuilder.createSpeechText(REPROMPT_MSG)));
        break;
    }
  })

  //終了時
  .onSessionEndedRequest(async responseHelper => {
    console.log('onSessionEndedRequest');
  })
  .handle();
  


// リプロント
function getRepromptMsg(speechInfo){
  const speechObject = {
    type: 'SimpleSpeech',
    values: speechInfo,
  };
  return speechObject;
}