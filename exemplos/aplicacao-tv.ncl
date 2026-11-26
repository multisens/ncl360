<?xml version="1.0" encoding="UTF-8"?>
<!-- Aplicação Ginga-NCL da TV que apresenta a cena olhar-para-revelar.ncl360
     num óculos de realidade virtual e reage ao que acontece nela. -->
<ncl id="aplicacaoTv" xmlns="http://www.ncl.org.br/NCL4.0/MainDTVProfile">
    <head>
        <regionBase>
            <region id="rgAviso" left="5%" top="80%" width="40%" height="15%"/>
        </regionBase>
        <descriptorBase>
            <descriptor id="dsAviso" region="rgAviso"/>
        </descriptorBase>
        <connectorBase>
            <causalConnector id="onBeginStart">
                <simpleCondition role="onBegin"/>
                <simpleAction role="start" max="unbounded"/>
            </causalConnector>
            <causalConnector id="onEndStop">
                <simpleCondition role="onEnd"/>
                <simpleAction role="stop" max="unbounded"/>
            </causalConnector>
        </connectorBase>
    </head>
    <body>
        <port id="pCena" component="cena"/>

        <!-- A cena inteira é uma mídia do tipo application/x-ncl360. Cada
             âncora corresponde, pelo label, ao id de uma mídia da cena. -->
        <media id="cena" type="application/x-ncl360" src="olhar-para-revelar.ncl360">
            <area id="aCartao" label="cartao"/>
        </media>

        <media id="aviso" src="media/aviso.png" descriptor="dsAviso"/>

        <!-- Enquanto o cartão está aberto no óculos, a TV mostra um aviso. -->
        <link id="lAvisoInicio" xconnector="onBeginStart">
            <bind role="onBegin" component="cena" interface="aCartao"/>
            <bind role="start" component="aviso"/>
        </link>
        <link id="lAvisoFim" xconnector="onEndStop">
            <bind role="onEnd" component="cena" interface="aCartao"/>
            <bind role="stop" component="aviso"/>
        </link>
    </body>
</ncl>
