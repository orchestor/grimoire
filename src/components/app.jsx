import React from 'react';
import ReactDOM from 'react-dom';
import GrokUtils from "../GrokUtils";
import GPage from "./gpage.jsx";

import Select from 'react-select';
import 'whatwg-fetch';
import fetchival from 'fetchival';

var GU = new GrokUtils();

class App extends React.Component {
  state = {
      mode:"grok",
      addTopic:"",
      addItem:"",
      grTopic:"",
      grItem:"",
      topic:"",
      item:"",
      gtype: "grok",
      grimoire: require("../grimoire/grimoire.js"),
      percentCompleted:"0%",
      options : [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' }
      ],
      defaultSearch:"",
      defaultTopic:"",
      showAdder:false,
      theMarkdown:[{string:""}],
      visibleMarkdown:[{string:""}],
      questions:[],
      qHistory:[],
      qIndex:0,
      headings:[],
      loading:false
    };
    constructor(props) {
        super(props);
        if (!localStorage.mode) {
            console.log("setting mode");
            localStorage.mode = "grimoire";
        }
    }
    componentDidMount = () => {
       var questions = GU.getQuizzableQuestions(this.state.grimoire);
       var nq = 0
       var noptions = []; //set above
       console.log("h1");
       for (var topic in this.state.grimoire) {
           for (var item in this.state.grimoire[topic]) {
               noptions.push({"value":item,"label":topic+"/"+item,topic:topic,item:item});
               nq += 1;
           }
       }
       try {
            var dTopic = localStorage.topic;
            var dItem = localStorage.item;
            var dMode = localStorage.mode;           
            this.setState({defaultSearch:dItem,defaultTopic:dTopic});
        if (!dTopic || !dItem){ 
            console.log("topic / item not found");
            var dTopic = questions[0]["topic"]
            var dItem = questions[0]["item"]
            var dMode ="grok";
            this.setState({defaultSearch:dItem,defaultTopic:dTopic});
        }  
       } catch (e) {
            console.log("no stored");
            var dTopic = questions[0]["topic"]
            var dItem = questions[0]["item"]
            var dMode ="grok";
            this.setState({defaultSearch:dItem,defaultTopic:dTopic});
       }
        
       var percentCompleted = String(Math.floor(100 * (1 - questions.length / nq)))+"%";
       console.log("pc", percentCompleted);
       this.setState({questions:questions,percentCompleted:percentCompleted,grTopic:questions[0]["topic"],grItem:questions[0]["item"],options:noptions,mode:dMode,topic:dTopic,item:dItem, defaultSearch:dTopic+"/"+dItem})
       
       //so lazy
       if (dMode == "edit") {
         console.log("edit", dTopic, dItem);
         this.changeMarkdown(dTopic,dItem, true);
       } else if (dMode == "grok") { 
         console.log("grok or edit");
         this.changeMarkdown(dTopic,dItem, false);      
       } else {
         console.log("grimoire");
         this.changeMarkdown(dTopic,dItem, true);
       }
       if (localStorage.scrollTop) {
           window.scrollTo(0, localStorage.scrollTop);
       }
    }
  changeTopic = (e) => {
      this.setState({addTopic:e.target.value});
  }
  changeItem = (e) => {
      this.setState({addItem:e.target.value});
  }
  showAdd = () => {
      this.setState({showAdder:!this.state.showAdder});
  }
  
  doAdd = () => {
      if (this.state.addItem != "" && this.state.addTopic != "") {
          var that = this;
          localStorage.mode= "edit";
          localStorage.topic= that.state.addTopic;
          localStorage.item= that.state.addItem;
          fetchival(window.location+"add").post({topic:this.state.addTopic,item:this.state.addItem,gtype:this.state.gtype}).then(function(resp) {
            console.log("editing!");
            localStorage.mode= "grimoire";
            
            //this really should poll to see if we've actually updated it rather than a default wait TODO
            function dr() {
                that.setState({loading:false});
                location.reload()
            }
            that.setState({loading:true});
            setTimeout(dr,  1000);
            
          })
      }
  }
  advance = () => {
      var vMarkdown = [];
      for (var ii = 0 ; ii < this.state.qIndex + 2 ; ii++) {
        vMarkdown.push(this.state.theMarkdown[ii]);
      }
      this.setState({qIndex:this.state.qIndex+1,visibleMarkdown:vMarkdown});
  }
  nextQuestion = (answer) => {
    if (answer == "good") {

    }
    var questions = this.state.questions.slice(0);
    var question = questions.shift();
    var qHistory = this.state.qHistory.slice(0);
    qHistory.unshift(question);
    var percentCompleted = String(Math.floor(100 * (1 - questions.length / (questions.length + qHistory.length))))+"%";
    this.setState({questions:questions,qHistory:qHistory,percentCompleted:percentCompleted});
    this.grokIndex(); //move markdown etc to initial item in questions list
  }
  grokIndex = () => {
    console.log("grok mode");
    this.setState({mode:"grok",defaultSearch:"",defaultTopic:""});
    localStorage.mode="grok";
    localStorage.item=this.state.questions[0]["item"];   
    localStorage.topic=this.state.questions[0]["topic"];
    this.grokChange({topic:this.state.questions[0]["topic"],item:this.state.questions[0]["item"]})
  }
   //lazy way to do it -> improve!
  grokChange = (val) => {
    console.log("grok mode");
    localStorage.topic=val.topic;
    localStorage.item=val.item;
    localStorage.mode="grok";
    this.setState({defaultSearch:val.item,defaultTopic:val.topic,topic:val.topic,item:val.item});
    this.changeMarkdown(val.topic, val.item, false);
  }
  //lazy way to do it -> improve!
  logChange = (val) => {
    console.log("Selected: " + JSON.stringify(val));
    console.log("grimoire mode");
    localStorage.topic=val.topic;
    localStorage.item=val.item;
    localStorage.mode="grimoire";
    this.setState({mode:"grimoire",defaultSearch:val.topic+"/"+val.item,defaultTopic:val.topic,topic:val.topic,item:val.item});
    this.changeMarkdown(val.topic, val.item, true);
  }
  setDefaultSearch = (topic, item) => {
      this.setState({defaultSearch:item,defaultTopic:topic,topic:topic,item:item});
      this.goTo(topic, item);
  }
  goTo = (topic, item) => {
      this.setState({visibleMarkdown:this.state.theMarkdown, mode:"grimoire",defaultSearch:item,defaultTopic:topic,topic:topic,item:item});
  }
  //cmode = true -> visible = all (for grimoire mode)
  fetchMd = (topic, item, cmode) => {
        var that = this;
        console.log("fetching", topic, item);
        fetchival(window.location+"read").post({topic:topic,item:item}).then(function(res) {
                  console.log("here",res["markdown"]) 
                  that.setState({headings:res["markdown"]["headings"]});
                  that.setState({theMarkdown:res["markdown"]["sections"]}); //unparsed
                  if (!cmode) {
                    //grokking
                    console.log("grokking");
                    that.setState({visibleMarkdown:[res["markdown"]["sections"][0]],qIndex:0}); //unparsed
                  } else {
                    console.log("grimoiring");
                    that.setState({visibleMarkdown:res["markdown"]["sections"],qIndex:0}); //unparsed   
                  }
        }).catch(function(err) {
            that.setState({theMarkdown:[{string:""}],visibleMarkdown:[{string:""}],qIndex:0} ); //unparsed
            console.log("error", err);
        });
  }
  changeMarkdown = (topic, item, cmode) => {
    console.log("new md", topic, item);
    var loadDefault = false;
    if (topic in this.state.grimoire) {
        if (item in this.state.grimoire[topic]) {
            loadDefault = false;
            this.fetchMd(topic, item, cmode);
        } else {
            console.log('not in');
            loadDefault = true;
        }
    }
    if (loadDefault) {
        //there is some bug here after adding a question: TODO
        if (this.state.questions.length == 0) {
            console.log(this.state.grimoire);
            var questions = GU.getQuizzableQuestions(this.state.grimoire);
            this.setState({questions:questions});
        }
        console.log("ld", this.state.questions);       
        this.fetchMd(this.state.questions[0]["topic"], this.state.questions[0]["item"], false);
    }
  }
  grimoireIndex = () => {
      this.setState({mode:"grimoire"});
      localStorage.mode="grimoire";
  }
  onChangeGtype = (e) => {
      this.setState({gtype:e.target.value}); 
  }
  updateGrimoire = () => {
    grimoire = require("../grimoire/grimoire.js");
    this.setState({grimoire:grimoire});
  }
  /* answer is 0 (again) 1 (ok) 2 (good) update state here,
   can push that question slightly back in the array if 0 */
  updateQuestions = (topic, item, answer) => {
      console.log("update question", topic, item, answer);
  }
  doVisit = (e) => {
      console.log("thing", e.target.value);
  }
  doEdit = () => {
       console.log(window.location.host);
       this.setState({mode:"edit"});
       /*
       if (this.state.defaultTopic != "" && this.state.defaultSearch != "") {
        fetchival(window.location+"edit").post({topic:this.state.defaultTopic,item:this.state.defaultSearch})
       }
       */
   }
  /* update the markdown */
  doUpdate = (newMarkdown) => {
        var that = this;
        fetchival(window.location+"edit").post({topic:this.state.topic,item:this.state.item,newMarkdown:newMarkdown}).then(function(resp) {
            console.log("updating!", resp);
            localStorage.mode="grimoire";
            //localStorage.item=that.state.addTopic;
            //localStorage.topic=that.state.addItem;
            location.reload();
            //that.grimoireIndex();
            //that.logChange({topic:that.state.addTopic,item:that.state.addItem});
        })
  }
  doMode = (newMode) => {
      if (!this.state.showAdder) {
          this.setState({mode:newMode});      
      }
  }
  print = () => {
      alert("reload to exit print mode!");
      this.setState({mode:"print"})
      localStorage.mode="grimoire";
  }
  render() {
    if (this.state.mode == "grok" && this.state.grTopic != ""&& this.state.grItem != "") {
        var theBar = <div className="progress-bar progress-bar-show-percent" data-filled="Loading {this.state.percentCompleted}">
            <div className="progress-bar-filled" style={{width: this.state.percentCompleted}}></div>
        </div>;
    }
    
    if (this.state.mode == "grimoire") {
        var theBar = <hr></hr>
    }
    
    if (this.state.showAdder) {
        var adder =   <div style={{display:"flex",flexDirection:"row"}}>
        <input placeholder={"topic"}  onChange={this.changeTopic}></input>
                 <input placeholder={"item"}  onChange={this.changeItem}></input>
                  <div style={{display:"flex",flexDirection:"row"}}>
                    <div>
                        <div>grok</div>
                        <div>no</div>
                    </div>
                    <div  style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                        <input type="radio" onChange={this.onChangeGtype}  checked={this.state.gtype=="grok"} name="gtypeheader" value="grok"></input>
                        <input type="radio" onChange={this.onChangeGtype} checked={this.state.gtype=="grimoire"} name="gtypeheader" value="grimoire"></input> 
                    </div>
                 </div>
                 <button style={{margin:"5px"}} onClick={this.doAdd} className="btn btn-primary btn-ghost">+add</button>
                </div>
    } else {
        var adder = null;
    }
    var homeIcon =  <img src="../images/blue-home-icon.png" style={{height:"1.5em",width:"1.5em",margin:"5px"}}  onClick={this.grimoireIndex} ></img>;
    if (window.innerWidth >= 400) {
        homeIcon = <div style={{margin:"5px"}} onClick={this.grimoireIndex}> Grimoire </div>
    }
    var loader = null;
    if (this.state.loading) {
        loader = <div className="loading"></div>
    }
    var topMatter = null;
    if (this.state.mode != "print") {
         topMatter= <div> 
           <h4>
               <div style={{margin:"5px"}} onClick={this.grokIndex}> Grok </div> 
               <div style={{margin:"5px"}}>|</div>
                  {homeIcon}
               <div style={{margin:"5px"}}>|</div>
               <div style={{margin:"5px"}} onClick={this.doEdit}> Edit </div>
               <div style={{margin:"5px"}}>|</div>
               <div style={{margin:"5px"}} onClick={this.showAdd}> Add </div>
               <div style={{margin:"5px"}}>|</div>
               <div style={{margin:"5px"}} onClick={this.print}> Print </div>
                {loader}
            </h4>
            <Select
                name="form-field-name"
                value={this.state.defaultSearch}
                options={this.state.options}
                onChange={this.logChange}
            />
            {adder}
            {theBar} 
            </div>;
        }
        
            //{topMatter}

            //<GPage grimoireIndex={this.grimoireIndex} update={this.doUpdate} headings={this.state.headings} nextQuestion={this.nextQuestion} advance={this.advance} visibleMarkdown={this.state.visibleMarkdown} theMarkdown={this.state.theMarkdown} mode={this.state.mode} doEdit={this.doEdit} topic={this.state.topic} item={this.state.item} goTo={this.goTo} grimoire={this.state.grimoire} /> 
    return (
        <div>        
            {topMatter}
             <GPage grimoireIndex={this.grimoireIndex} update={this.doUpdate} headings={this.state.headings} nextQuestion={this.nextQuestion} advance={this.advance} visibleMarkdown={this.state.visibleMarkdown} theMarkdown={this.state.theMarkdown} mode={this.state.mode} doEdit={this.doEdit} topic={this.state.topic} item={this.state.item} goTo={this.goTo} doMode={this.doMode} grimoire={this.state.grimoire} /> 
        </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
