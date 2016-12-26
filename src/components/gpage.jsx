import React from 'react';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
import fetchival from 'fetchival';
import mk from 'markdown-it-katex';

//import Textarea from 'react-textarea-autoheight';
import Textarea from 'react-textarea-autosize';


//var md = require('markdown-it')(), //doesn't quite work with webpack... 
var md = window.markdownit();
md.set({html:true});

md.use(mk);
md.use(require('markdown-it-decorate'));
md.use(require('markdown-it-highlightjs'), {auto:true})

class MarkdownQuizRenderer  extends React.Component {
    render () {
        var that = this;
        console.log("visible markdown", this.props.visibleMarkdown);
        return (
              <div >
                {
                    this.props.visibleMarkdown.map(function(section, idx) {
                    return( 
                        <div key={idx} ref="article" className="markdown" dangerouslySetInnerHTML={{__html: that.props.replaceImageWithTopicItem(that.props.topic, that.props.item, md.render(section["string"]))}}></div>)
                    })
                }
                {that.props.nextPart}
                {that.props.theButtons}
                
            </div>
        )
    }
}

class MarkdownGrimoireRenderer extends React.Component {
    render () {
        var that = this;
        console.log("all  markdown", this.props.theMarkdown);
        return (
              <div >
                {
                    this.props.theMarkdown.map(function(section, idx) {
                    return( 
                        <div key={idx} ref="article" className="markdown" dangerouslySetInnerHTML={{__html: that.props.replaceImageWithTopicItem(that.props.topic, that.props.item, md.render(section["string"]))}}></div>)
                    })
                }
                {that.props.nextPart}
                {that.props.theButtons}
            </div>
        )
    }
}

class MarkdownEditor extends React.Component {
    state = {
        newMarkdown:"",
        uploadedImage:"",
        triggerSave:true
    }
    componentDidMount = () => {
        var initialMarkdown = "";
        for (var sectionKey in this.props.theMarkdown) {
            initialMarkdown = initialMarkdown + this.props.theMarkdown[sectionKey]["string"]
        }
        this.setState({newMarkdown:initialMarkdown});
        console.log("height", window.innerHeight);
    }
    componentWillReceiveProps = (nextProps) => {
        if (this.props.triggerSave != this.state.triggerSave) {
            this.update();
            this.setState({triggerSave:this.props.triggerSave});
        }
    }
    markdownChanged = (e) => {
        this.setState({newMarkdown:e.target.value});        
    }
    update = () => {
        this.props.update(this.state.newMarkdown);
    }
    onDrop = (files) => {
        console.log("got files",files);
        var img = files[0]["preview"];
        try {
          this.setState({uploadedImage:img});
          fetchival(window.location+"addImage").post({topic:this.props.topic,item:this.props.item,image:files[0]}).then(function(resp) {
            console.log("image added");
         });
        } catch (e) {
            console.log("error uploading image!");
        }
    }
    previewFile = (e) => {
        console.log(e.target.files[0]);
        this.uploadTheImage(e.target.files[0]);
    }
    uploadTheImage = (theFile) => {
        var reader  = new FileReader();
        var that = this;
         
        reader.onload = function () {
            console.log("loaded", reader.result);
            var i = new Image(); 

            i.onload = function(){

                that.setState({uploadedImage:reader.result});
                fetchival(window.location+"addImage").post({topic:that.props.topic,item:that.props.item,image:reader.result}).then(function(resp) {
                    console.log("image added to server", resp["filename"]);
                    that.setState({newMarkdown : that.state.newMarkdown+"\n\n <img src=\""+resp["filename"]+"\" width=\""+Math.floor(i.width/2)+"\"><img>"});
                }).catch(function(err) {
                    alert("error "+err);
                });
            
            };

            i.src = reader.result;
        }
        reader.readAsDataURL(theFile);
    }
    /* note this doesn't seem to work in safari as of 12/18/2016, but seems ok in other browsers */
    handlePaste = (e) => {
        console.log("handling paste!", e.target);
        console.log("\n");
        var data = e.clipboardData.items[0].getAsFile();
        
        this.uploadTheImage(data);
    }
    render () {
        var that = this;
        return (
            <div>
                <Textarea style={{flex:1,display:"flex",width:window.innerWidth}} onPaste={this.handlePaste} onChange={this.markdownChanged} value={this.state.newMarkdown} />
                <div>
                    <button onClick={this.props.discard} className="btn btn-error ">Discard</button>
                    <button onClick={this.update} className="btn btn-primary">{"Save"+"   "}</button>
                </div>
            </div>
        )
        
    }
}

//<input type="file" onChange={this.previewFile}></input>
//<div style={{width:window.innerWidth,display:"flex",flexDirection:"row",justifyContent:"center",alignItems:"center"}}>
//<img src={this.state.uploadedImage} style={{width:100}} alt="image preview"></img>
//</div>

class GPage extends React.Component {
    state = {
        gtype:"grok",
        triggerSave:false
    }
    doEdit = () => {
        console.log(window.location.host);
        fetchival(window.location+"edit").post({topic:this.props.topic,item:this.props.item})
    }
    componentDidMount = () => {
        //console.log("vm", this.props.theMarkdown);
        var that = this;
        console.log("mounting gpage");
        document.body.onkeydown = function(e){
            //49-52, trigger buttons
            if (that.props.mode == "grok") {
                console.log('pressed', e.which);
                switch(e.keyCode){
                    case 49:
                        console.log("1");
                        break;
                    case 50:
                        console.log("2");
                        break;
                    case 51:
                        if (that.props.visibleMarkdown.length < that.props.theMarkdown.length) {
                            that.nextPart();
                        } else {
                            that.answerGood();
                        }
                        console.log("3");
                        break;
                    case 52:
                        console.log("4");
                        break;
                    default:
                        break;
                }
            } else if (that.props.mode == "grimoire") {
                console.log("hotkey grimoire", e.which)
                switch(e.keyCode) {
                    case 69:
                        console.log("edit mode!");
                        localStorage.scrollTop = document.documentElement.scrollTop;
                        that.props.doMode("edit");
                        break;
                    default:
                        break;
                }
            } else if (that.props.mode == "edit") {
                 console.log(" key: ", e.which);
                 if (e.keyCode == 83 && e.ctrlKey && e.altKey) {
                    console.log("save!");
                    that.setState({triggerSave:!that.state.triggerSave})
                }
            }
        };
    }
    replaceImageWithTopicItem(topic, item, theHtml) {
        var newHtml = theHtml.replace(/(<img src=")(.*?)(" )/g, function(match,$1,$2,$3){
            console.log("match" ,match, $1,$2,$3);
            /* clean up dis */
            //return $1+"grimoire/"+topic+"/"+item+"/"+$2+$3 + " style=\"max-width:650px;width:100%;\"";
            return $1+"grimoire/"+topic+"/"+item+"/"+$2+$3 + " style=\"max-width:650px;\""; 
        })
        //console.log(newHtml);
        return newHtml;
    }
    onChangeGtype = (e) => {
        console.log("set grok", e.target.value);
        this.setState({gtype : e.target.value});
        fetchival(window.location+"setGtype").post({topic:this.props.topic,item:this.props.item, gtype:e.target.value});
    }
    nextPart = () => {
        this.props.advance();
    }
    answerGood = () => {
        this.props.nextQuestion("good");
    }
    componentDidUpdate = () => {
        if (this.props.mode == "grok") {
            window.scrollTo(0, document.body.scrollHeight + 300);
        }
        console.log('t',window.innerHeight - 3);
    }
    render () {
        var that = this;
        if (this.props.mode== "grok" && this.props.visibleMarkdown.length < this.props.theMarkdown.length) {
            var theButtons = <div style={{display:"flex",flexDirection:"row",justifyContent:"center",flex:1}}>
                                <button className="btn btn-info btn-ghost">Back</button>
                                <button className="btn btn-info btn-ghost">Back</button>           
                                <button className="btn btn-error btn-ghost">Fail</button>                           
                                <button className="btn btn-primary btn-ghost" onClick={this.nextPart}>Next</button>
                                <button className="btn btn-success btn-ghost">All</button>
                            </div>;
            var nextPart = <div style={{color:"#ff2e88",display:"flex",flexDirection:"row",justifyContent:"center",flex:1,marginBottom:"1em"}} >Q: {this.props.headings[this.props.visibleMarkdown.length]}</div>
                            
        } else if (this.props.mode == "grok") {
            var theButtons = <div style={{display:"flex",flexDirection:"row",justifyContent:"center",flex:1}}>
                                <button className="btn btn-info ">Back</button>
                                <button className="btn btn-error">Bad</button>
                                <button className="btn btn-primary">Good</button>
                                <button className="btn btn-success">Easy</button>
                            </div> ;
            var nextPart = null;
        } else {
            console.log(this.props.mode , "m");
            var theButtons = null;
            var nextPart = null;
        }
        
        //visibleMarkdown replaceImageWithTopicItem, topic, item, nextPart, buttons
        
        //idea: MarkdownThing should be used for displaying
        
        //something like MarkdownEditor for editing 
        if (this.props.mode == "edit") {
            console.log("gpage - edit");
            return (
                <MarkdownEditor triggerSave={this.state.triggerSave} update={this.props.update} discard={this.props.grimoireIndex} theMarkdown={this.props.theMarkdown} replaceImageWithTopicItem={this.replaceImageWithTopicItem} topic={this.props.topic} item={this.props.item} nextPart={nextPart} theButtons={theButtons} />
            )
        
        } else if  (this.props.mode == "grimoire" || this.props.mode == "print") {
            return (
                <MarkdownGrimoireRenderer theMarkdown={this.props.theMarkdown} replaceImageWithTopicItem={this.replaceImageWithTopicItem} topic={this.props.topic} item={this.props.item} nextPart={nextPart} theButtons={theButtons} />
            )
        
         } else if (this.props.mode == "grok") {

            return (
                <MarkdownQuizRenderer visibleMarkdown={this.props.visibleMarkdown} replaceImageWithTopicItem={this.replaceImageWithTopicItem} topic={this.props.topic} item={this.props.item} nextPart={nextPart} theButtons={theButtons} />
            )
        } 
    }
}
module.exports = GPage;